/**
 * Contains functions which might as well be extensions of Array prototype (but aren't for safety reasons).
 * 
 * @name util.arrays
 * @namespace
 */

/**
 * @return {Object?} the last element of the given array, or <code>undefined</code> if array is empty
 */ 
exports.last = function( array ) {
   return array[ array.length - 1 ];
};
