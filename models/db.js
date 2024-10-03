const sql = require('mssql');

const config = {
    user: 'sa', // tu nombre de usuario
    password: '123456', // tu contraseña
    server: 'localhost', // dirección del servidor
    database: 'Urban_solar', // nombre de la base de datos
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

async function conectar() {
    try {
        await sql.connect(config);
        console.log("Conectado a la base de datos");
    } catch (err) {
        console.error("Error de conexión: ", err);
    }
}

module.exports = { sql, conectar };
