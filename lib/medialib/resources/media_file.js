var ContentType = require( '../content_types' ).ContentType;
var StatusCode = require( '../status_codes' ).StatusCode;
var contentHash = require( '../util/strings' ).contentHash;
var async = require( 'async' );
var inherits = require( 'util' ).inherits;
var Assert = require( '../util/assert' ).Assert;
var clone = require( '../util/objects' ).clone;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function Resource() {
   Assert.that( this.contentType ).isDefined();
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.linkify = function( request, entity, callback ) {
   callback( null, value );
};
   
//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.createEntityFromValue = function( request, value, callback ) {
   new Error( 'abstract method' );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.requestHandlers = function() {
   // Unfortunately I can't just pass the resource object into express.js, because it stores the handlers
   // internally.
   return {
      show: this.show.bind( this ),
      create: this.create.bind( this ),
      load: this.load.bind( this )
   };
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.create = function( request, response ) {
      
   var self = this;
   var createEntity = function( callback ) {
      self.createEntityFromValue( request, request.body, callback );
   };
   
   var saveEntity = function( entity, callback ) {
      request.context.entityStore.create( entity, callback );
   };
   
   var triggerEvent = function( entity, callback ) {
      callback( null, entity );
   };

   var emitResponse = function( entity, callback ) {
      self.linkify( request, entity, function( err, value ) {

         response.contentType( self.contentType );
         response.send( JSON.stringify( value ), StatusCode.Created );
     
      } );
   };
   
   async.waterfall( [ createEntity, saveEntity, triggerEvent, emitResponse ], function( err, result ) {
      
      if( !err ) {
         onComplete( null, result );
         return;
      }
     
      console.error( err );
      console.trace();
      
      self.emitInternalServerError( request, response );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.show = function( request, response ) {
   
   response.contentType( this.contentType );
   response.send( JSON.stringify( request.entities[ this ].value ), StatusCode.Ok );

};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

Resource.prototype.load = function( request, id, callback ) {
   request.context.entityStore.getByEntityID( id, function( err, entity ) {
      
      if( !err ) {
         if( !request.entities ) {
            request.entities = {};
         }
         // this.toString() is implied
         request.entities[ this ] = entity;
      }
      
      callback( err, err || entity );
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////
   
// TODO: semantically not really a part of Resource 
Resource.prototype.emitInternalServerError = function( request, response ) {
   
   var error = {
      status: 'InternalServerError'
   };
   
   response.contentType( ContentType.Error );
   response.send( JSON.stringify( error ), StatusCode.InternalServerError );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function MediaFileResource()
{
   Resource.apply( this, arguments );
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

inherits( MediaFileResource, Resource );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.prototype.contentType = ContentType.MediaFile;

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.prototype.linkify = function( request, entity, callback ) {
   
   var value = clone( entity.value );
   var address = request.context.address; 
   value.links = [ {
      rel: 'self', url: address.mediaFiles.show( entity )
   }, {
      rel: 'song', url: address.songs.show( request.song )
   }  ];
   
   callback( null, value );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

MediaFileResource.prototype.createEntityFromValue = function( request, mediaFile, callback ) {
   var hash = contentHash( mediaFile.url ); 
   var entity = {
      type: 'MediaFileEntity',
      entityID: 'urn:mediaFile:' + contentHash( Date.now(), hash ),
      // TODO: no good here, because coupled to uri fragment names (song)
      songID: request.song.entityID,
      hash: hash,
      value: mediaFile
   };   
   
   callback( null, entity );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.MediaFileResource = MediaFileResource;
