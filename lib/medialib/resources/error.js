var ContentType = require( '../content_types' ).ContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var Resource = require( './resource' ).Resource;
var inherits = require( 'util' ).inherits;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ErrorResource( context, entity ) {
   this._statusCode = StatusCode[ entity.value.status ];
   Resource.apply( this, arguments );
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( ErrorResource, Resource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ErrorResource.CONTENT_TYPE = ContentType.Error;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ErrorResource.createSchemaValidationErrorResource = function( context, details ) {
   var errorValue = {
      status: 'Forbidden',
      cause: {
         message: 'JSON schema validation failed. Details are included.',
         details: details
      }
    };
   
   return new ErrorResource( context, { value: errorValue } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ErrorResource.createInternalServerErrorResource = function( context, cause ) {
   
   var errorValue = {
      status: 'InternalServerError'
   };
   
   return new ErrorResource( context, { value: errorValue } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ErrorResource.createRequestContentTypeErrorResource = function( context ) {
   var errorValue = {
      status: 'UnsupportedMediaType',
      cause: {
         message: 'Unsupported or missing Content-Type'
      }
    };
   
   return new ErrorResource( context, { value: errorValue });
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ErrorResource.prototype.createResponse = function( callback ) {   
   Resource.prototype.createResponse.call( this, this._statusCode, callback );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.ErrorResource = ErrorResource;
