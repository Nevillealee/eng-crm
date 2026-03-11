### Building and running your application

When you're ready, start your application by running:
`docker compose up --build`.

Your application will be available at http://localhost:3000.

### Deploying your application

To deploy your application, you can use the following command to run the database migrations:
`docker compose exec server npx prisma migrate deploy`


### References
* [Docker's Node.js guide](https://docs.docker.com/language/nodejs/)