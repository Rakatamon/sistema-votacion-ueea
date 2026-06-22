import xlsx from 'xlsx';
import fs from 'fs';
import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, writeBatch, getDocs, deleteDoc } from "firebase/firestore";

const firebaseConfig = {
    apiKey: "AIzaSyDYEIWEgn98OVg96HpGizahm0km4MR8PUE",
    authDomain: "ueea-voting-sys-app.firebaseapp.com",
    projectId: "ueea-voting-sys-app",
    storageBucket: "ueea-voting-sys-app.firebasestorage.app",
    messagingSenderId: "8175839029",
    appId: "1:8175839029:web:146c78fa9f9f6f5898ce7c"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const run = async () => {
    // 1. Read Excel
    const workbook = xlsx.readFile('DOCS/listado estudiantes 2026 CONSEJO ESTUDIANTIL.xlsx');
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet, { header: 1 });
    
    // 2. Parse Students
    const students = [];
    let counter = 1;

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        if (!row || row.length === 0) continue;
        
        // Find rows that start with a number like "1." or "2." or just a number
        const indexVal = row[0];
        if (indexVal && typeof indexVal === 'string' && /^\d+\.$/.test(indexVal.trim())) {
            const apellido = row[2] || '';
            const secApellido = row[3] || '';
            const nombre = row[4] || '';
            const secNombre = row[5] || '';
            const cursoRaw = row[8] || '';
            const paraleloRaw = row[9] || '';

            const fullName = [nombre, secNombre, apellido, secApellido].filter(p => p && p.trim() !== '').join(' ');
            const courseLevel = cursoRaw.trim();
            let courseName = paraleloRaw.trim();
            
            // clean up quotes in courseName
            courseName = courseName.replace(/"/g, '');

            const code = String(counter).padStart(4, '0');
            counter++;

            students.push({
                code,
                fullName,
                courseLevel,
                courseName,
                hasVoted: {}
            });
        }
    }

    console.log(`Parsed ${students.length} students from Excel.`);
    if (students.length === 0) {
        console.error("No students found. Checking the excel parsing logic.");
        process.exit(1);
    }

    // 3. Generate CSV
    const csvRows = ['Código Estudiantil,Nombre Completo,Nivel Curso,Nombre Curso'];
    for (const student of students) {
        csvRows.push(`${student.code},"${student.fullName}","${student.courseLevel}","${student.courseName}"`);
    }
    fs.writeFileSync('DOCS/plantilla_votantes_2026.csv', csvRows.join('\n'), 'utf8');
    console.log('CSV generated at DOCS/plantilla_votantes_2026.csv');

    // 4. Upload to Firebase
    console.log("Connecting to Firebase and clearing old data...");
    const appId = "voting-app-ueea";
    const votersPath = `/artifacts/${appId}/public/data/voters`;
    
    const oldVoters = await getDocs(collection(db, votersPath));
    // batch delete
    let batch = writeBatch(db);
    let opCount = 0;
    for (const docSnap of oldVoters.docs) {
        batch.delete(docSnap.ref);
        opCount++;
        if (opCount === 500) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
    }
    
    console.log("Old data cleared. Uploading new students...");
    batch = writeBatch(db);
    opCount = 0;
    for (const student of students) {
        const voterRef = doc(db, votersPath, student.code);
        batch.set(voterRef, {
            fullName: student.fullName,
            courseLevel: student.courseLevel,
            courseName: student.courseName,
            hasVoted: student.hasVoted
        });
        opCount++;
        if (opCount === 500) {
            await batch.commit();
            batch = writeBatch(db);
            opCount = 0;
        }
    }
    if (opCount > 0) {
        await batch.commit();
    }

    console.log('Firebase upload complete!');
    process.exit(0);
};

run().catch(console.error);
