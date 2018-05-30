'use strict';
const doc = require('dynamodb-doc');
const dynamo = new doc.DynamoDB();

const UserHandler = require('./handlers/Users/UserHandler');
const LocationHandler = require('./handlers/location/LocationHandler');
const RequestHandler = require('./handlers/request/RequestHandler');
const logger = require('./logging/Logger');


/**
 * Demonstrates a simple HTTP endpoint using API Gateway. You have full
 * access to the request and response payload, including headers and
 * status code.
 *
 * To scan a DynamoDB table, make a GET request with the TableName as a
 * query string parameter. To put, update, or delete an item, make a POST,
 * PUT, or DELETE request respectively, passing in the payload to the
 * DynamoDB API as a JSON body.
 */
exports.handler = (event, context, callback) => {
    logger.info('Received event: ' + JSON.stringify(event));

    const done = (err, res) => callback(null, {
        statusCode: err ? 400 : 200,
        body: err ? err.message : JSON.stringify(res),
        headers: {
            'Content-Type': 'application/json',
        },
    });

    let parameters = event.parameters || {};
    let tableName = parameters.TableName || "";

    switch (event.httpMethod) {
        case 'DELETE':
            dynamo.deleteItem(JSON.parse(event.body), done);
            break;
        case 'GET':
            dynamo.scan({TableName: event.queryStringParameters.TableName}, done);
            break;
        case 'POST':

            switch (tableName) {
                case "location":
                    LocationHandler.insertLocationEntry(parameters.locationEntry, done);
                    break;
                case "request":                    
                    RequestHandler.insertRequestEntry(parameters.requestEntry, done);
                    break;
                default:
                    returnErrorResponse("POST action not supported for table: " + tableName, callback);
            }
            break;

        case 'PUT':

            // Check for a valid table name
            switch (tableName) {
                case "User":
                    // Check for valid parameters
                    if (parameters.UserID) {
                        UserHandler.addUser(parameters.UserID, done);
                    } else {
                        returnErrorResponse("No UserID provided", callback);
                    }
                    break;
                default:
                    returnErrorResponse("PUT action not supported for table: " + tableName, callback);
            }

            break;
        default:
            done(new Error("Unsupported method " + event.httpMethod));
    }
};

/**
 * Returns an HTTP 400 response with the error message
 * @param {*} errorMessage 
 * @param {*} httpCallback 
 */
let returnErrorResponse = (errorMessage, httpCallback) => {
    let httpResponse = {
        statusCode: 400,
        body: errorMessage,
        headers: {
            'Content-Type': 'application/json',
        }
    };

    httpCallback(null, httpResponse);
};
