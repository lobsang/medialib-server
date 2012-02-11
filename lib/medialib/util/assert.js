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
   isNotUndefined: function( messages, object ) {
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
      if( object == false ) {
         messages.push( util.format( "object '%s' is not truthy", object ) );
         return false;
      }
      
      return true;
   },
   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * 
 * @constructor
 * @param {Object} testee
 */
function Assertions( testee ) {
   this.testee = testee;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Assertions.prototype.fail = function( messages ) {
      
   var err = {
      message: 'Assertion failed with cause: ' + messages.join( ', ' )
   };
   
   err.__proto__ = Error.prototype;
   throw err;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Object.keys( tests ).forEach( function( key ) {

   Assertions.prototype[ key ] = function() {
      var condition = tests[ key ];
      
      var messages = [];
      var args = [messages, this.testee].concat( Array.prototype.slice.call( arguments, 0 ) );
      if( !condition.apply( null, args ) ) {
         this.fail( messages );
      }
      
      return this;
   };
   
} );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Assert = {
   that: function( testee ) {
      return new Assertions( testee );
   }
};
