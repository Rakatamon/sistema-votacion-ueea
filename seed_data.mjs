import { initializeApp } from "firebase/app";
import { getFirestore, collection, doc, setDoc, writeBatch, getDocs, deleteDoc } from "firebase/firestore";

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

const seedData = async () => {
    try {
        console.log("Seeding data...");
        const appId = "voting-app-ueea";
        const electionsPath = `/artifacts/${appId}/public/data/elections`;
        const votersPath = `/artifacts/${appId}/public/data/voters`;
        const votesPath = `/artifacts/${appId}/public/data/votes`;

        // Clear existing data to prevent duplicates
        console.log("Clearing old dummy data...");
        const oldVotes = await getDocs(collection(db, votesPath));
        for (const docSnap of oldVotes.docs) {
            await deleteDoc(doc(db, votesPath, docSnap.id));
        }

        const batch = writeBatch(db);

        // 1. Create an active election
        const electionId = "eleccion-ficticia-2026";
        const electionRef = doc(db, electionsPath, electionId);
        batch.set(electionRef, {
            name: "Elecciones Estudiantiles 2026",
            createdAt: new Date().toISOString(),
            isActive: true,
            options: [
                { id: "lista-a", name: "Lista A - Renovación", color: "#3B82F6" },
                { id: "lista-b", name: "Lista B - Progreso", color: "#10B981" },
                { id: "blanco", name: "Voto en Blanco", color: "#9CA3AF" },
                { id: "nulo", name: "Voto Nulo", color: "#EF4444" }
            ]
        });

        // 2. Create some voters
        const courses = ["1ero BGU A", "1ero BGU B", "2do BGU A", "3ero BGU A"];
        
        // Generate 50 voters
        for(let i=1; i<=50; i++) {
            const course = courses[i % courses.length];
            const courseLevel = course.split(" ")[0];
            const courseName = course.split(" ").slice(1).join(" ");
            const hasVoted = Math.random() > 0.3; // 70% chance of having voted
            const votedOption = hasVoted ? ["lista-a", "lista-b", "blanco", "nulo"][Math.floor(Math.random() * 4)] : null;
            
            const voterData = {
                fullName: `Estudiante Ficticio ${i}`,
                courseLevel,
                courseName,
                hasVoted: hasVoted ? { [electionId]: true } : {}
            };
            
            const voterRef = doc(db, votersPath, `MAT-${1000 + i}`);
            batch.set(voterRef, voterData);
            
            if (hasVoted) {
                // Register the vote
                const voteRef = doc(collection(db, votesPath));
                batch.set(voteRef, {
                    electionId,
                    optionId: votedOption,
                    timestamp: new Date().toISOString(),
                    courseLevel,
                    courseName,
                    voterCode: `MAT-${1000 + i}`
                });
            }
        }

        await batch.commit();
        console.log("Data seeded successfully!");
        process.exit(0);
    } catch (e) {
        console.error("Error seeding data:", e);
        process.exit(1);
    }
};

seedData();
