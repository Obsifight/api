var mysql = require('mysql')

module.exports = {

  connections: {},
  config: {},

  setConfig: function (config) {
    this.config = config
    return this
  },

  get: function (connectionName) {
    if (this.connections[connectionName] === undefined) {
      this.connections[connectionName] = mysql.createConnection({
        host: this.config[connectionName].host,
        user: this.config[connectionName].user,
        password: this.config[connectionName].password,
        database: this.config[connectionName].dbname,
        connectionLimit: 10,
        socketPath: '/tmp/mysql.sock'
      })
      this.connections[connectionName].connect()
    }
    return this.connections[connectionName]
  }

}
