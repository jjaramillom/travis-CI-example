const keys = require('../../config/keys');
const Buffer = require('safe-buffer').Buffer;
const Keygrip = require('keygrip');

module.exports = (user) => {
  // const id = '5ed9541dd5d765dcd0dea4ef';
  const sessionObject = {
    passport: { user: user._id.toString() },
  };

  const session = Buffer.from(JSON.stringify(sessionObject)).toString('base64');
  const keygrip = new Keygrip([keys.cookieKey]);
  const sig = keygrip.sign(`session=${session}`);

  return { session, sig };
};
