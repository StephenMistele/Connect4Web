# Connect4Web

This repo contains the code nessesary to run the API that supports the connect4game hosted at the repo https://github.com/StephenMistele/Connect4WebUI, or live at https://connect4.stephenmistele.com. To run this project locally, make sure you have node installed, then navigate to the project directory and run npm install, followed by npm start.

With the API now running, you can manually hit the controllers to simulate gameplay with a tool like postman, or spool up the before mentioned Connect4WebUI repo, point it to localhost:3000, and mess around. 



Deployment notes for myself:

High level - code lives in /app folder in digital ocean droplet, and is compiled and run in a dockerized container. This server runs at port 3000, so nginx is used to redirect requests from :80 -> :3000, as well as handling the DNS and SSL aspects. Don't use PM2, or try to run the server with 'npm start' or 'node app.js' or something silly like that. Docker runs the server, nginx handles the wrapping

some helpful commands:

Pull code changes:
obviously "git pull"

Rebuild/Rerun Docker (needed to account for code changes):
may need to "docker stop connect4api" to kill existing process
rebuild code with "docker build -t connect4api ."
start process with "docker run -p 3000:3000 connect4api" - note that adding a -d flag next to the -p flag will make it run in the background (won't occupy terminal)

To make changes to Nginx configuration settings:
edit nginx config: "sudo nano /etc/nginx/sites-available/default"
test config syntax: "sudo nginx -t"
reload nginx (needed for effects to take place): "sudo systemctl reload nginx.service"