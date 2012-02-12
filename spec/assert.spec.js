var Assert = require( '../lib/medialib/util/assert' ).Assert;

describe( 'Assert', function() {

   // isNotNull
   
   it( 'throws error if null is required to be not null', function() {
      expect( function() {
         Assert.that( null ).isNotNull();
      } ).toThrow( 'Assertion failed with cause: object is null' );
   } );
   
   it( 'returns itself if undefined is required to be not null', function() {
      expect( Assert.that( undefined ).isNotNull() ).toBeTruthy();
   } );
   
   it( 'returns itself if an empty object is required to be not null', function() {
      expect( Assert.that( {} ).isNotNull() ).toBeTruthy();
   } );  
   
   // isDefined/isNotUndefined
   
   it( 'throws error if undefined is required to be not undefined', function() {
      expect( function() {
         Assert.that( undefined ).isDefined();
      } ).toThrow( 'Assertion failed with cause: object is undefined' );
   } );

   it( 'returns itself if null is required to be not undefined', function() {
      expect( Assert.that( null ).isNotUndefined() ).toBeTruthy();
   } );
   
   // hasType
   
   it( 'throws error if undefined is required to have type String', function() {
      expect( function() {
         Assert.that( undefined ).hasType( String );
      } ).toThrow( "Assertion failed with cause: object 'undefined' not of expected type 'String'" );
   } );

   it( 'throws error if null is required to have type String', function() {
      expect( function() {
         Assert.that( null ).hasType( String );
      } ).toThrow( "Assertion failed with cause: object 'null' not of expected type 'String'" );
   } );
   
   it( 'returns itself if {} is required to have type Object', function() {
      expect( Assert.that( {} ).hasType( Object ) ).toBeTruthy();
   } );
   
   it( 'returns itself if [] is required to have type Array', function() {
      expect( Assert.that( [] ).hasType( Array ) ).toBeTruthy();
   } );
   
   it( 'returns itself if "" (primitive) is required to have type String', function() {
      expect( Assert.that( '' ).hasType( String ) ).toBeTruthy();
   } );
   
   it( 'returns itself if "" (object) is required to have type String', function() {
      expect( Assert.that( new String( '' ) ).hasType( String ) ).toBeTruthy();
   } );
   
   it( 'returns itself if 0 (primitive) is required to have type Number', function() {
      expect( Assert.that( 0 ).hasType( Number ) ).toBeTruthy();
   } );

   it( 'returns itself if false (primitive) is required to have type Boolean', function() {
      expect( Assert.that( false ).hasType( Boolean ) ).toBeTruthy();
   } );
   
   // hasKeys
   
   it( 'throws error if null is required to have key "a"', function() {
      expect( function() {
         Assert.that( null ).hasKeys( 'a' );
      } ).toThrow( "Assertion failed with cause: object 'null' is missing keys: 'a'" );
   } );
   
   it( 'throws error if null is required to have key "a"', function() {
      expect( function() {
         Assert.that( undefined ).hasKeys( 'a' );
      } ).toThrow( "Assertion failed with cause: object 'undefined' is missing keys: 'a'" );
   } );
   
   it( 'throws error if {} is required to have keys "a", "b", "c"', function() {
      expect( function() {
         Assert.that( {} ).hasKeys( 'a', 'b', 'c' );
      } ).toThrow( "Assertion failed with cause: object '{}' is missing keys: 'a', 'b', 'c'" );
   } );
   
   it( 'throws error if { a: null, b: null } is required to have keys "a", "b", "c"', function() {
      expect( function() {
         Assert.that( { a: null, b: null } ).hasKeys( 'a', 'b', 'c' );
      } ).toThrow( "Assertion failed with cause: object '{\"a\":null,\"b\":null}' is missing keys: 'c'" );
   } );
   
   it( 'returns itself if { a: null, b: null } is required to have keys "a", "b", specified as varargs', function() {
      expect( Assert.that( { a: null, b: null } ).hasKeys( 'a', 'b' ) ).toBeTruthy();
   } );
   
   it( 'returns itself if { a: null, b: null } is required to have keys "a", "b", specified as array', function() {
      expect( Assert.that( { a: null, b: null } ).hasKeys( ['a', 'b'] ) ).toBeTruthy();
   } );
   
   it( 'returns itself if { a: null, b: null } is required to have keys "a", "b", specified as object', function() {
      expect( Assert.that( { a: null, b: null } ).hasKeys( { a: null, b: null } ) ).toBeTruthy();
   } );
   
   // Chaining
   
   it( 'can be chained', function() {
      expect( Assert.that( {} ).isDefined().isNotNull() ).toBeTruthy();
   } );


} );