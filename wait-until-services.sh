#!/bin/bash

./wait-until.sh http://localhost:3001/ 404
./wait-until.sh http://localhost:3002/ 404
./wait-until.sh http://localhost:3003/ 403
./wait-until.sh http://localhost:3004/ 404
./wait-until.sh http://localhost:3005/ 404
./wait-until.sh http://localhost:3006/ 404
./wait-until.sh http://localhost:3007/ 403