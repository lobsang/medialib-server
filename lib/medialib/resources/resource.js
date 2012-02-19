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

/**
 * TODO: Consider introducing a RequestHandler type which solves the problem to this solution in a
 *       polymorphic manner.
 * 
 * Convenience implementation to be used by specific Resource sub types.
 * 
 * @example
 * SongResource.handleShow = partial( Resource.handleShow, SongResource );
 * 
 */
Resource.handleShow = function( resourceConstructor, context, id, callback ) {

   context.entityStore.getByEntityID( id, function( err, entity ) {

      if( err ) {
         console.error( err );
         exports.Error.createInternalServerErrorResource( err ).createResponse( callback );
         return;
      }

      new resourceConstructor( context, entity ).createResponse( StatusCode.Ok, callback );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.Resource = Resource;
