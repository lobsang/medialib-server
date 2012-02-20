exports.all = {
   views: {
      equality: {
         map: function( doc ) {
            if ( doc.type ) {
               emit( [ doc.type, doc.hash ], null );              
            }
         }
      }
  }  
};
