'use strict';
const endConversation = ({sessionId, context, entities}) => {
  return new Promise((resolve, reject) => {
    context.jobDone = true;
    console.log('Endconve');
    return resolve(context);
  });
}

module.exports = endConversation;
