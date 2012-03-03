/**
 * Contains functions which might as well be extensions of Array prototype (but aren't for safety reasons).
 * 
 * @name util.arrays
 * @namespace
 */

/**
 * @return {Object?} the last element of the given array, or <code>undefined</code> if array is empty
 */ 
function last( array ) {
   return array[ array.length - 1 ];
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * @example
 * 
 * contains( [0] ) // false
 * contains( [0, 1, 2], 1 ) // true
 * contains( [0, 1, 2], 1, 2 ) // true
 * contains( [0, 1, 2], 1, 2, 3 ) // false
 */
function contains( array ) {
   var elements = Array.prototype.slice.call( arguments, 1 );
   
   if( elements.length === 0 ) {
      return false;
   }
   
   for( var i = 0; i < elements.length; i++ ) {
      
      var element = elements[ i ];
      if( array.indexOf( element ) !== -1 ) {
         return false;
      }
   }
   
   return true;   
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.contains = contains;
exports.last = last;
