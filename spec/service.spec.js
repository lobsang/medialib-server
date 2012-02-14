var medialib = require( '../lib/medialib' );
var wwwdude = require( 'wwwdude' );
var util = require( 'util' );
var fs = require( 'fs' );
var Enumerable = require( '../lib/vendor/linq.js/linq.js' ).Enumerable;

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

var fixture = {
   songs: JSON.parse( fs.readFileSync( __filename.replace( /js$/, 'songs.json' ), 'utf8' ) ).songs
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

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

   it( 'starts listening when started', function( done ) {
      service.start( function( err ) {
         
         expect( err ).toBeFalsy();
         
         httpClient.get( baseURL ).on( 'complete', function ( data, response ) {

            expect( response.statusCode ).toBe( 200 );
            
            done();
         } );
         
      } );
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'rejects song creations without content type', function( done ) {

      var request = {
         payload: JSON.stringify( fixture.songs[ 0 ] ),
         headers: {}
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

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
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

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
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 415 );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   var song = null;
   it( 'creates a song', function( done ) {

      var request = {
         payload: JSON.stringify( fixture.songs[ 0 ] ),
         headers: { 'Content-Type': mediaLibrary.contentTypes.Song }
      };
      
      httpClient.post( baseURL + '/0/songs', request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 201 );
         song = JSON.parse( data );
            
         done();
      } );

   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'returns a song representation, containing a self link', function() {

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
      
      var request = {
         headers: { 'Content-Type': mediaLibrary.contentTypes.Song }
      };
      
      expect( url ).toBeTruthy();

      httpClient.get( url, request ).on( 'complete', function ( data, response ) {

         expect( response.statusCode ).toBe( 200 );
            
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
