/**
 * Contains functions which might as well be extensions of Object prototype (but aren't for safety reasons).
 * 
 * @name util.objects
 * @namespace
 */

/**
 * Returns <code>true</code> if the given argument is a plain object, <code>false</code> otherwise.
 * <p>
 * A plain object is an object which does not contain any type specific properties and behavior which is
 * offered by the given object by account of it being of a particular type.
 * 
 * @example
 * isPlainObject( {} ); // true
 * isPlainObject( [] ); // false
 * isPlainObject( 'hello world' ); // false
 * isPlainObject( new Error() ); // false
 *
 * @param {?Object=} object the object to test
 */
function isPlainObject( object ) {
   return object && object.constructor.name === 'Object' && object !== this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function clone( object ) {
   // Lose this restriction when I actually need it.
   if( !isPlainObject( object ) ) {
      // This will also happen if null or undefined is passed in.
      throw new Error( 'unsupported operation: clone only implemented for plain objects' );
   }
   
   // Good enough for now, will croak on cyclic references.
   return JSON.parse( JSON.stringify( object ) );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Extends the receiver with all property descriptors specified by enumerable own properties of the given
 * objects.
 * <p>
 * Existing property descriptors in the target object with the same name as descriptors to be copied from the
 * source objects will be overwritten.
 * 
 * @param {...Object} source objects
 * 
 * @name extend
 * @function
 */
function extend( target ) {
   Array.prototype.slice.call( arguments, 1 ).forEach( function( source ) {
      var props = Object.getOwnPropertyNames( source );
      
      props.forEach( function( name ) {
         var property = Object.getOwnPropertyDescriptor( source, name );
         Object.defineProperty( target, name, property );
      } );
   } );

   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @return an array of keys coerced from the given arguments
 */
function coerceToKeys( keysOrSource )
{
   if( keysOrSource instanceof Array ) {
      // Interpret as array of keys
      return keysOrSource;
   }
   else if( keysOrSource instanceof Object ) {
      return Object.keys( keysOrSource );
   }

   // Interpret arguments as array of keys
   return Array.prototype.slice.call( arguments, 0 );
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Tests if the target object contains a set of specific keys and return an array of those keys which are not
 * contained within the target object.
 */
function missingKeys( target )
{
   var requiredKeys = coerceToKeys.apply( null, Array.prototype.slice.call( arguments, 1 ) );

   if( target == null ) {
      return requiredKeys;
   }
   
   var targetKeys = Object.keys( target );
   
   var missingKeys = [];
   for( var i = 0; i < requiredKeys.length; ++i ) {
      var key = requiredKeys[ i ];
      if( targetKeys.indexOf( key ) === -1 ) {
         missingKeys.push( key );
      };
   }

   return missingKeys;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hasKeys() {
   return missingKeys.apply( null, arguments ).length === 0;  
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function hasType( object, expectedType ) {

   if ( object == null ) {
      return false;
   }

   if ( typeof ( expectedType ) === 'string' && typeof ( object ) !== expectedType ) {
      return false;
   }

   if ( typeof ( expectedType ) === 'function' ) {

      // This provides "autoboxing" for primitives, i.e. turns 6 instanceof Number into truth
      if ( expectedType === object.constructor ) {
         return true;
      }

      if ( !( object instanceof expectedType ) ) {
         return false;
      }

   }

   return true;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

extend( exports, {
   clone: clone,
   isPlainObject: isPlainObject,
   extend: extend,
   hasType: hasType,
   hasKeys: hasKeys,
   missingKeys: missingKeys
} );
