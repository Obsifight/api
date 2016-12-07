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
        database: this.config[connectionName].dbname
      })
      var self = this
      this.connections[connectionName].connect(function (err) {
        if (err) {
          throw err
        }
        return self.connections[connectionName]
      })
    } else {
      return this.connections[connectionName]
    }
  }

}
