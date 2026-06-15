import React from 'react';

const Messages = ({ error, success, clearMessages }) => {
    if (!error && !success) return null;

    return (
        <div className="my-3 mx-auto max-w-xl px-4">
            {error && (
                <div className="p-3 bg-red-100 text-red-700 border border-red-300 rounded-md text-sm flex justify-between items-center">
                    <span>{error}</span>
                    <button onClick={clearMessages} className="ml-2 text-red-700 font-bold text-lg">&times;</button>
                </div>
            )}
            {success && (
                <div className="p-3 bg-green-100 text-green-700 border border-green-300 rounded-md text-sm flex justify-between items-center">
                    <span>{success}</span>
                    <button onClick={clearMessages} className="ml-2 text-green-700 font-bold text-lg">&times;</button>
                </div>
            )}
        </div>
    );
};

export default Messages;
