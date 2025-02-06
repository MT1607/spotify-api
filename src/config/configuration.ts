import * as process from 'node:process';

export default () => ({
  spotify: {
    clientId: process.env.SPOTIFY_CLIENT_ID,
    secretId: process.env.SPOTIFY_CLIENT_SECRET,
    redirectUri: process.env.SPOTIFY_REDIRECT_URI,
  },
});
