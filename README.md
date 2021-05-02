# OBS-tally
Use your cellphone as tally light for OBS multicamera production


## Install 

1. npm install --prod
2. copy `config.default.json` to `./config.json`
3. generate and copy your LAN sslcert to `./sslcert/server.key` and `./sslcert/server.crt`
   - if you don't knoww to generate one, install for example "xampp" and copy it from there
3. npm start


## Usage
1. Install obs-websocket and setup it accordingly.
2. Start obs-tally
3. Go to website and click the scene you wish to listen for tally.
   - When obs changes scene, the tally will light up.

> :info: You may wish to add small patch of red or white tape to your cellphone light to dim it a little.