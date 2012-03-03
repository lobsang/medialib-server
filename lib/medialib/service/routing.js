var quoteForRegExp = require( '../util/strings' ).quoteForRegExp;
var resources = require( './resources' );
var arrays = require( '../util/arrays' );
var util = require( 'util' );

// TODO: This is much too complicated. I spend a lot of effort determining the context handler (i.e. the
//       mapping node) by using the entity context. That same information could be derived if for a given
//       request I knew the express-resource from which the route originated.
// TODO: Reconsider concepts and their relationships: The service layer should mainly be concerned with
//       resources. As it is, it mainly deals with entities (which are the lower-level concept).
// TODO: Consider giving express-resource the axe. Lots of the complexity here actually stems from the
//      integration with express-resource.

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function ResourceMappings( service ) {
   this.service = service;
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Returns the mapping node as specified by the context as defined by the given entity path.
 * 
 * @param entities
 * @returns the mapping node identified by the given entity path
 */
ResourceMappings.prototype.contextNode = function( entities ) {
   var current = this.root;
   entities.forEach( function( entity ) {
      current = current.selfOrChild( entity.type );
   } );
   return current;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ResourceMappings.prototype.resourcePath = function( entities ) {
   return this.contextNode( entities ).boundPath( entities );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

ResourceMappings.prototype.mapEntity = function( entityType, path, actions ) {
   var mapping = new EntityMappingNode( this.service, null, entityType, path, actions );
   this.root = mapping;
   this[ path ] = mapping;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

function EntityMappingNode( service, parent, entityType, path, actions ) {
   
   actions = actions || resources.resourceActions( entityType );
   
   // The express resource.
   var resource = service.resource( path, actions );

   this.path = path;
   this.parent = parent;
   this.children = [];
   this.affordances = [];
   this.resource = resource;
   this.entityType = entityType;
   
   this.service = service;
   
   return this;
}

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityMappingNode.prototype.addAffordance = function( method, path, handler ) {
   this.resource.map( method, path, handler );
   
   this.affordances.push( {
      
      method: method,
      path: path,
      handler: handler
      
   } );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityMappingNode.prototype.mapEntity = function( entityType, path, actions ) {

   var child = new EntityMappingNode( this.service, this, entityType, path, actions );
   this.children.push( child );
   if( this.resource ) {
      // console.log( "%s.add( %s )", this.resource.id, child.resource.id );
      this.resource.add( child.resource );
   }
   
   this[ path ] = child;
   return this;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityMappingNode.prototype.ancestorsAndSelf = function() {
  
   var ancestors = []; // including self
   var ancestor = this;
   while( ancestor ) {
      ancestors.push( ancestor );
      ancestor = ancestor.parent;
   }
   ancestors.reverse();
   return ancestors;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityMappingNode.prototype.boundPath = function( theEntities ) {
   var entities = theEntities.slice( 0 );
   var contextNodes = this.ancestorsAndSelf();
   
   // The last route is the most specific
   var path = arrays.last( Object.keys( this.resource.routes[ 'get' ] ) );
   
   contextNodes.forEach( function( node ) {
      var e = entities.shift();
      var id = e ? e.self : '';
      var param = node.resource.param;
      
      path = path.replace( new RegExp( quoteForRegExp( param ) ), id );
   } );
   
   var format = this.resource.format || '.:format?';
   path = path.replace( new RegExp( quoteForRegExp( format ) ), '' );
   
   return path;
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

EntityMappingNode.prototype.selfOrChild = function( entityTypeName ) {
   if( this.entityType.name === entityTypeName ) {
      return this;
   }
   
   for( var i = 0; i < this.children.length; i++ ) {
      if( this.children[ i ].entityType.name === entityTypeName ) {
         return this.children[ i ];
      }
   }
   
   throw util.format( "Illegal State: entityType '%s' not found below '%s'", entityTypeName, this.entityType.name );
};

//////////////////////////////////////////////////////////////////////////////////////////////////////////////

exports.ResourceMappings = ResourceMappings;
