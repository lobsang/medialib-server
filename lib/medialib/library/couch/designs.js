exports.all = {
   views: {
      equality: {
         map: function( doc ) {
            if ( doc.type ) {
               emit( [ doc.type, doc.hash ], null );              
            }
         }
      },
      selection: {
         map: function( doc ) {
            if ( doc.type ) {
               doc.rels.forEach( function( rel ) {
                  emit( [ doc.type, rel.target ], null );              
               } );
            }
         }
      }
  }  
};
