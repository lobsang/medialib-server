Use Cases
=========

Scanning Client
---------------

Client scans user music files. Client sends each song to server with the intention of creating a song resource 
on the server.
           
Server stores songs. Server also creates corresponding album and artist resources on the fly or updates 
existing resources with new song. Server responds to client request with song representation which contains 
links to all participating artists and all albums it is part of.

Abstract: The server builds a relationship graph involving songs, artists and albums by intelligently creating 
resources and inferring relationships. 

Architecture & Design
======================

The original idea was to have a programmatic media library interface independent of the web service sitting
on top. However, sensible as that objective might seem, I actively decided against it for now, because it only
leads to indirections between HTTP specific concepts (HTTP headers, Content Types, etc.) and media library
concepts.

As it stands I already have responses as a concept of the media library domain which contains a subset of 
properties characterizing a HTTP response. The design of the media library api is driven by the RESTful
service on top anyways (what with the REST verbs translating into create/show/index/etc. actions within
the media library domain), so in order to harness the full power of the HTTP/REST stack I might as well ease 
up on my early restrictions.

What does REST bring to the table?
----------------------------------

Apart from well understood concepts such as the verbs and their semantics with respect to safe and idempotent
operations, there are less well understood (to me) concepts which heavily contribute to the promise of REST
though. The promises are easy extensibility through lose coupling between server and client, high scalability
and general client ease of use.

The means by which to achieve those promises are objectives unto themselves to my media library implementation:

* _Hypermediality (HATEOAS)_:

* _Content-Types_:

* _Opaque resource uris_:

Moreover the following principles lead the decision making about particular api details:

* _Avoid rpc_: 


Representations, entities and resources
----------------------------------------
A song is a bunch of meta data for a playable item of music. This bunch of meta data gains its resource 
semantics simply by virtue of having its own unique identity and being somehow addressable and thus 
susceptible to inspection and manipulation by interested clients.

Then we have the canonical representation of a song. This is a JavaScript object which is used in code 
to carry the bunch of meta data around. From that canonical representation, one representation 
(serialization, really) for each supported data format can be derived.

As such, this part of the code only cares for the application/Song part of the application/Song+json 
content type.

Within this layer there is also the song entity, a container for a song, which contains the song value 
itself and also provides the identity for the song. It also contains relationships to other entities.
 
The canonical song representation is derived from this entity by applying a transformation which mixes part 
of the entity data into the song representation for the purpose of achieving hypermediality (in particular 
the relationships between entities are represented as links).

The transformation basically goes like this: _song -> entity(entityData, song) -> song'_.
In words: Client puts song, Library wraps it in a song entity, thus endowing the representation received
from the client with it's own identity. Enriches the song with links of related resources. Sends a
serialization of that back to the client.
