var util = require( 'util' ),
      fn = require( './functions' ),
       o = require( './objects' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

var tests = {
   isNotNull: function( messages, object ) {
      if( object === null ) {
         messages.push( 'object is null' );
         return false;
      }
      
      return true;
   },
   isDefined: function( messages, object ) {
      if( object === undefined ) {
         messages.push( 'object is undefined' );
         return false;
      }
      
      return true;
   },
   hasKeys: function hasKeys( messages, object ) {
    
      var missingKeys = o.missingKeys.apply( null, Array.prototype.slice.call( arguments, 1 ) );
      if( missingKeys.length !== 0 ) {     
         
         var keys = missingKeys.map( function( item ) {
            return "'" + item + "'";
         } ).join( ', ' );
         
         messages.push( util.format( "object '%j' is missing keys: %s", object, keys ) );
         return false;
      }
         
      return true;
   },
   hasType: function( messages, object, expectedType ) {
      
      var expectedTypeName = typeof( expectedType ) === 'function' ?
            fn.functionName( expectedType ) : expectedType;
      
      if( object == null ) {
         messages.push( 
            util.format( "object '%s' not of expected type '%s'",
               object, expectedTypeName ) );
         return false;
      }
      
      if( typeof( expectedType ) === 'string' && typeof( object ) !== expectedType ) {
         messages.push( 
            util.format( "object '%s' not of expected type '%s' (actual: '%s')",
                  object, expectedTypeName, typeof( object ) ) );
         
         return false;
      }
      
      if( typeof( expectedType ) === 'function' ) {
         
         // This provides "autoboxing" for primitives, i.e. turns 6 instanceof Number into truth
         if( expectedType === object.constructor ) {
            return true;
         }
         
         if ( !( object instanceof expectedType ) ) {
            messages.push( util.format( "object '%s' not instance of '%s' (actual: '%s')",
                  object, expectedTypeName, fn.functionName( object.constructor ) ) );
            
            return false;
         }

      }
      
      return true;
   },
   isPlainObject: function( messages, object ) {
      if( !isPlainObject( object ) ) {
         messages.push( util.format( "object '%s' is not plain object (actual type: '%s')", object, 
                         object != null ? fn.functionName( object.constructor ) : 'null' ) );
         return false;
      }
      
      return true;
   },
   isTruthy: function( messages, object ) {
      if( !object || object == false ) {
         messages.push( util.format( "object '%s' is not truthy", object ) );
         return false;
      }
      
      return true;
   },
   
};

tests.isNotUndefined = tests.isDefined;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @constructor
 * @param {Object} testee
 */
function Assertions() {
   this.testees = Array.prototype.slice.call( arguments, 0 );
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Assertions.prototype.fail = function( messages ) {
   
   var details = [];
   if( this.testees.length === 1 ) {
      details = messages;    
   }
   else {
      var i = 0;

      messages.forEach( function( argMessages ) {
         if( argMessages.length === 0) {
            i++;
            return;
         }
         details.push( ('[argument at index ' + i++ + ']: ' ) + argMessages.join( ', ') );
      } );
      
   }
   
   throw new Error( 'Assertion failed with cause: ' + details.join( '; ' ) );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Object.keys( tests ).forEach( function( key ) {

   Assertions.prototype[ key ] = function() {
      var condition = tests[ key ];
      
      var failed = false;
      var messages = [];
      var args = Array.prototype.slice.call( arguments, 0 );
      
      this.testees.forEach( function( testee ) {

         var messagesForArg = [];
         messages.push( messagesForArg );
         
         args = [messagesForArg, testee].concat( args );

         if( !condition.apply( null, args ) ) {
            failed = true;
         }
      } );
      
      if( failed ) {
         this.fail( messages );
      }
      
      return this;
   };
   
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Assert = {
   that: function() {
      var a = new Assertions();
      Assertions.apply( a, arguments );
      return a;
   }
};
