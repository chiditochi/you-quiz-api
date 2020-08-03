FROM node:10 

WORKDIR /usr/src/DevApp 

COPY package.json . 

RUN npm install 

COPY . . 

EXPOSE 3001

CMD ["npm", "start"]
