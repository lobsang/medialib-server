var medialib = require( '../lib/medialib' );
var wwwdude = require( 'wwwdude' );
var util = require( 'util' );
var fs = require( 'fs' );
var Enumerable  = require( '../lib/vendor/linq.js' ).Enumerable;

var conf = {
   "mediaLibrary": {
      "couch": {
         "db": "medialib-test",
         "host": "localhost",
         "port": 5984
      }
   },
   "webService": {
      "contextRoot" : "/medialib",
      "listenPort": 4000
   }
};

var httpClient = wwwdude.createClient( {
   headers: { 'User-Agent': 'medialib test client' },
   timeout: 500
} );

var fixture = JSON.parse( fs.readFileSync( __filename.replace( /js$/, 'songs.json' ), 'utf8' ) );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// This tests have system test character. They exercise the whole system. Nothing is isolated, nothing is
// mocked.
//
// Unfortunately the ordering of the tests also matters. Tests build upon one another.

describe( 'medialib service', function() {

   var mediaLibrary = null;
   var service = null;
   var baseURL = null;
   
   beforeEach( function () {
      if( !service ) {
         
         mediaLibrary = new medialib.MediaLibrary( conf.mediaLibrary );
         service = new medialib.MediaLibraryService( conf.webService, mediaLibrary );
                  
         baseURL = util.format( "http://localhost:%d%s", conf.webService.listenPort, conf.webService.contextRoot );

      }
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var library = null;
   var songsURL = null;
   it( 'starts listening when started', function( done ) {
      service.start( function( err ) {

         var request = {
            headers: { 'Content-Type': medialib.contentTypes.Library }
         };
         
         expect( err ).toBeFalsy();
         
         httpClient.get( baseURL, request ).on( 'complete', function ( data, response ) {
            
            if( response.statusCode === 302 ) {
               return;
            }

            expect( response.statusCode ).toBe( 200 );
            library = JSON.parse( data );
            
            songsURL = Enumerable.From( library.links )
               .Where( "$.rel == 'songs'" )
               .Select( "$.url" )
               .First();
            
            expect( songsURL ).toBeTruthy();
            
            done();
         } );
         
      } );
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song creations without content type', function( done ) {
      var song = JSON.parse( JSON.stringify( fixture.songs[ 0 ] ) );
      var request = {
         payload: JSON.stringify( song ),
         headers: {}
      };
      
      httpClient.post( songsURL, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song with additional properties', function( done ) {

      var song = JSON.parse( JSON.stringify( fixture.songs[ 0 ] ) );
      song.myProperty = "value";
      
      var request = {
         payload: JSON.stringify( song ),
         headers: {}
      };
      
      httpClient.post( songsURL, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song with missing properties', function( done ) {

      var song = JSON.parse( JSON.stringify( fixture.songs[ 0 ] ) );
      delete( song.title );
      
      var request = {
         payload: JSON.stringify( song ),
         headers: {}
      };
      
      httpClient.post( songsURL, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   var song = null;
   it( 'creates a song', function( done ) {

      var request = {
         payload: JSON.stringify( fixture.songs[ 0 ] ),
         headers: { 'Content-Type': medialib.contentTypes.Song }
      };
      
      httpClient.post( songsURL, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 201 );
         song = JSON.parse( data );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returned a song representation, containing a self link', function() {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'self'" )
         .Select( "$.url" )
         .First();
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'responds with media data when querying a media link', function( done ) {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'media'" )
         .Select( "$.url" )
         .First();
      
      expect( url ).toBeTruthy();

      var request = {
      };
      
      httpClient.get( url, request ).on( 'complete', function ( data, response ) {

         // TODO: Make file to be delivered part of fixture (somehow) and test for 200
         expect( response.statusCode ).toBe( 404 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing a meda files link', function() {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'mediaFiles'" )
         .Select( "$.url" )
         .First();
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'responds when creating a new media file for a song', function( done ) {
      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'mediaFiles'" )
         .Select( "$.url" )
         .First();

      var item = JSON.parse( JSON.stringify( fixture.mediaFiles[ 0 ] ) );
      var request = {
         payload: JSON.stringify( item ),
         headers: { 'Content-Type': medialib.contentTypes.MediaFile }
      };
   
      expect( url ).toBeTruthy();

      httpClient.post( url, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 201 );
         // mediaFile = JSON.parse( data );
            
         done();
      } );
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing a media playback link', function() {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'media'" )
         .Select( "$.url" )
         .First();
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing an artist link', function() {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'artist'" )
         .Select( "$.url" )
         .First();
      
      expect( url ).toBeTruthy();
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'responds with song representation when querying song self link', function( done ) {

      var url = Enumerable.From( song.links )
         .Where( "$.rel == 'self'" )
         .Select( "$.url" )
         .First();
      expect( url ).toBeTruthy();

      var request = {
         headers: { 'Content-Type': medialib.contentTypes.Song }
      };

      httpClient.get( url, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 200 );

         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   it( 'lists artists', function( done ) {

      var url = Enumerable.From( library.links )
         .Where( "$.rel == 'artists'" )
         .Select( "$.url" )
         .First();
      expect( url ).toBeTruthy();
      
      var request = {
         headers: { 'Content-Type': medialib.contentTypes.LibraryItems }
      };

      httpClient.get( url, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 200 );
         var artists = JSON.parse( data );
         expect( artists.items.length ).toBe( 1 );
         
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'stops listening when stopped', function( done ) {
      
      var spec = this;
      service.stop( function( err ) {
         
         expect( err ).toBeFalsy();
         
         httpClient.get( baseURL ).
            on( 'error', function( err ) {
               expect( err.errno ).toEqual( 'ECONNREFUSED' );
               
               done();
            } ).
            on( 'complete', function ( data, response ) {
               spec.fail( 'Service still responding.' );
               done();
            } );
         
      } );
   } );
   
} );
