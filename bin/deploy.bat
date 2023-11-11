setlocal
cd ..
docker build -t samfisher753/open-chat:latest .
docker push samfisher753/open-chat:latest
ssh opc@143.47.44.201 "sudo docker stop open-chat; sudo docker rm open-chat; sudo docker pull samfisher753/open-chat:latest; sudo docker run -d -p 3000:3000 --name open-chat samfisher753/open-chat:latest"
endlocal