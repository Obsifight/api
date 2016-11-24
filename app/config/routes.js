module.exports = {

  'post /authenticate': 'AuthController.generateToken',

  'get /user/:username': {'function': 'UserController.get', protected: true},
  'get /user/:username/vote/can': 'UserController.canVote',

  'get /sanction/bans': {'function': 'SanctionController.getBans', protected: true}

}
