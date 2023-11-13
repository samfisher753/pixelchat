setlocal
cd ..
docker build -t samfisher753/pixelchat:latest .
docker push samfisher753/pixelchat:latest
ssh opc@143.47.44.201 "sudo docker stop pixelchat; sudo docker rm pixelchat; sudo docker pull samfisher753/pixelchat:latest; sudo docker run -d -p 3000:3000 --name pixelchat samfisher753/pixelchat:latest"
endlocal