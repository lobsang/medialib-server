var quoteForRegExp = require( '../util/strings' ).quoteForRegExp;
var resources = require( './resources' );
var arrays = require( '../util/arrays' );

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

// TODO: split this into real types (EntityRoutingTable?, RoutingNode?). Get the involved concepts straight.
// TODO: This is much too complicated. I spend a lot of effort determining the context handler (i.e. the
//       mapping node) by using the entity context. That same information could be derived if for a given
//       request I knew the express-resource from which the route originated.
// TODO: Consider giving express-resource the axe. Lots of the complexity here actually stems from the
//       integration with express-resource.
exports.newEntityMappings = function( service ) {

   var resourceMapping = function( parent, entityType, path, actions ) {
      actions = actions || resources.resourceActions( entityType );
      
      // The express resource.
      var resource = service.resource( path, actions );

      var m = {
         path: path,
         parent: parent,
         children: [],
         resource: resource,
         entityType: entityType,
         add: function( entityType, path, actions ) {

            var child = resourceMapping( this, entityType, path, actions );
            this.children.push( child );
            if( this.resource ) {
               // console.log( "%s.add( %s )", this.resource.id, child.resource.id );
               this.resource.add( child.resource );
            }
            
            this[ path ] = child;
            return this;
         },
         ancestorsAndSelf: function() {
           
            var ancestors = []; // including self
            var ancestor = this;
            while( ancestor ) {
               ancestors.push( ancestor );
               ancestor = ancestor.parent;
            }
            ancestors.reverse();
            return ancestors;
         },
         boundPathFragment: function( entity ) {
            
            var id = entity ? entity.self : '';
            // The last route is the most specific
            var path = arrays.last( Object.keys( this.resource.routes[ 'get' ] ) );

            var param = this.resource.param;
            path = path.replace( new RegExp( quoteForRegExp( param ) ), id );
            var format = this.resource.format || '.:format?';
            path = path.replace( new RegExp( quoteForRegExp( format ) ), '' );

            return path;
         },
         boundPath: function( theEntities ) {
            var entities = theEntities.slice( 0 );
            var contextNodes = this.ancestorsAndSelf();
            
            var pathFragments = contextNodes.map( function( node ) {
               return node.boundPathFragment( entities.shift() );
            } );
            
            return pathFragments.join( '' );
         },
         selfOrChild: function( entityTypeName ) {
            if( this.entityType.name === entityTypeName ) {
               return this;
            }
            
            for( var i = 0; i < this.children.length; i++ ) {
               if( this.children[ i ].entityType.name === entityTypeName ) {
                  return this.children[ i ];
               }
            }
            
            throw format( "Illegal State: entityType '%s' not found", entityTypeName );
         }

      };

      return m;
   };
   
   return {
      /**
       * Returns the mapping node as specified by the context.
       * 
       * @param entities
       * @returns the mapping node identified by the given entity path
       */
      contextNode: function( entities ) {
         var current = this.root;
         entities.forEach( function( entity ) {
            current = current.selfOrChild( entity.type );
         } );
         return current;
      },
      
      resourcePath: function( entity ) {
         // This contains knowledge, that all entities are below the library node (which is the root node).
         var m = this.root.selfOrChild( entity.type );
         return m.boundPathFragment( entity );
      },
      
      add: function( entityType, path, actions ) {
         var mapping = resourceMapping( null, entityType, path, actions );
         this.root = mapping;
         this[ path ] = mapping;
      }
   };
   
};
