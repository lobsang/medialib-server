var clone = require( '../util/objects' ).clone;
var extend = require( '../util/objects' ).extend;
var Assert = require( '../util/assert' ).Assert;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Resource( context, entity ) {
   Assert.that( context, entity ).isTruthy();

   this._context = context;
   this._entity = entity;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.linkify = function( repr, callback ) {
   callback( null, repr );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * When complete, calls the given callback with the canonical resource response.
 * 
 */
Resource.prototype.createResponse = function( statusCode, callback ) {

   var clonedRepr = clone( this._entity.value );
   var self = this;
   this.linkify( clonedRepr, function( err, repr ) {

      callback( err, repr && {
         statusCode : statusCode,
         headers : {
            contentType : self.constructor.CONTENT_TYPE
         },
         body: repr
      } );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Resource = Resource;
