const mysql = require('mysql2/promise');

const mysqlConfig = {
  host: 'localhost',
  port: 3306,
  database: 'ok',
  user: 'k',
  password: 'nah',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(mysqlConfig);

// Rename the old table if it exists and create a new sensor_data table
async function renameAndCreateTable() {
  const connection = await pool.getConnection();
  try {
    // Check if table sensor_data exists
    const [rows] = await connection.query("SHOW TABLES LIKE 'sensor_data'");
    if (rows.length > 0) {
      const epoch = Math.floor(Date.now() / 1000);
      const newTableName = `sensor_data_${epoch}`;
      await connection.query(`RENAME TABLE sensor_data TO ${newTableName}`);
      console.log(`Old table renamed to ${newTableName}`);
    }
    // If sensor_data does not exist, create it
    const [checkRows] = await connection.query("SHOW TABLES LIKE 'sensor_data'");
    if (checkRows.length === 0) {
      const createTableQuery = `
        CREATE TABLE sensor_data (
          id INT AUTO_INCREMENT PRIMARY KEY,
          Time VARCHAR(255),
          Temperature DOUBLE,
          Pressure DOUBLE,
          Altitude DOUBLE,
          Latitude DOUBLE,
          Longitude DOUBLE,
          gps_altitude DOUBLE,
          gps_sats INT,
          gyro_x DOUBLE,
          gyro_y DOUBLE,
          gyro_z DOUBLE,
          bmp_status INT,
          gps_status INT,
          gyro_status INT,
          apc_status INT,
          servo_status INT,
          servo_rotation DOUBLE,
          sd_status INT
        )
      `;
      await connection.query(createTableQuery);
      console.log("New sensor_data table created.");
    } else {
      console.log("Table 'sensor_data' already exists, not creating a new table.");
    }
  } catch (err) {
    console.error("MySQL error:", err);
    throw err;
  } finally {
    connection.release();
  }
}

// Insert a row (an array of values matching csvHeaders) into sensor_data
async function insertData(row) {
  const connection = await pool.getConnection();
  try {
    const insertQuery = `
      INSERT INTO sensor_data (Time, Temperature, Pressure, Altitude, Latitude, Longitude, gps_altitude, gps_sats, gyro_x, gyro_y, gyro_z, bmp_status, gps_status, gyro_status, apc_status, servo_status, servo_rotation, sd_status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;
    await connection.query(insertQuery, row);
    console.log("Data inserted into MySQL:", row);
  } catch (err) {
    console.error("Error inserting data into MySQL:", err);
  } finally {
    connection.release();
  }
}

module.exports = {
  renameAndCreateTable,
  insertData
};
