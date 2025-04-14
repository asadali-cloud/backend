import connected from './db/index.js';

const startApp = async () => {
    await connected();
    const PORT = process.env.PORT || 8000;
    console.log(`Server is running on port ${PORT}`);
};

startApp();