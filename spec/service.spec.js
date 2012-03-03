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
   var entryURL = null;
   
   beforeEach( function () {
      if( !service ) {
         
         mediaLibrary = new medialib.MediaLibrary( conf.mediaLibrary );
         service = new medialib.MediaLibraryService( conf.webService, mediaLibrary );
                  
         entryURL = util.format( "http://localhost:%d%s", conf.webService.listenPort, conf.webService.contextRoot );

      }
   } );
   
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   var library = null;
   var songsURL = null;
   it( 'lists libraries at entry url', function( done ) {
      service.start( function( err ) {

         var request = {
            headers: { 'Content-Type': medialib.contentTypes.MediaLibrary }
         };
         
         expect( err ).toBeFalsy();
         
         httpClient.get( entryURL, request ).on( 'complete', function ( data, response ) {

            expect( response.statusCode ).toBe( 200 );
            body = JSON.parse( data );
            
            expect( body.libraries ).toBeTruthy();
            expect( body.libraries.length ).toBe( 1 );
            songsURL = Enumerable.From( body.libraries[ 0 ].links )
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

   var songMediaFilesURL = null;
   describe( 'song response from create', function() {
      
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
      
      it( 'representation contains self link', function() {
         var links = Enumerable.From( song.links )
            .Where( "$.rel == 'self'" )
            .ToArray();
         expect( links.length ).toBe( 1 );
      } );

      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      it( 'representation contains media files link', function() {

         var links = Enumerable.From( song.links )
            .Where( "$.rel == 'mediaFiles'" )
            .ToArray();
      
         expect( links.length ).toBe( 1 );
         
         songMediaFilesURL = links[ 0 ].url;
      } );
      
      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      it( 'representation contains artists link', function() {

         var links = Enumerable.From( song.links )
            .Where( "$.rel == 'artists'" )
            .ToArray();
   
         expect( links.length ).toBe( 1 );
      } );
      
      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      it( 'representation contains albums link', function() {

         var links = Enumerable.From( song.links )
            .Where( "$.rel == 'albums'" )
            .ToArray();
   
         expect( links.length ).toBe( 1 );
      } );
      
      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      it( 'responds with song representation at song self url', function( done ) {

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
      
   } );

   ///////////////////////////////////////////////////////////////////////////////////////////////////////////

   describe( 'media file representation', function() {
   
      var mediaFile = null;
      
      it( 'is returned on creation', function( done ) {
   
         var item = JSON.parse( JSON.stringify( fixture.mediaFiles[ 0 ] ) );
         var request = {
            payload: JSON.stringify( item ),
            headers: { 'Content-Type': medialib.contentTypes.MediaFile }
         };
      
         expect( songMediaFilesURL ).toBeTruthy();
   
         httpClient.post( songMediaFilesURL, request ).on( 'complete', function ( data, response ) {
   
            expect( response.statusCode ).toBe( 201 );
            mediaFile = JSON.parse( data );
            
            var keys = Object.keys( mediaFile );
            expect( keys ).toContain( 'format' );
            expect( keys ).toContain( 'url' );
            expect( keys ).toContain( 'links' );
            
            done();
         } );
      } );
      
      ///////////////////////////////////////////////////////////////////////////////////////////////////////////
      
      it( 'contains stream link', function() {

         var links = Enumerable.From( mediaFile.links )
            .Where( "$.rel == 'stream'" )
            .ToArray();
   
         expect( links.length ).toBe( 1 );
      } );
      
   });
 
   ///////////////////////////////////////////////////////////////////////////////////////////////////////////
   
   it( 'stops listening when stopped', function( done ) {
      
      var spec = this;
      service.stop( function( err ) {
         
         expect( err ).toBeFalsy();
         
         httpClient.get( entryURL ).
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
