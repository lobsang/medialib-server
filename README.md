Media Library
=============

A node.js application for managing media meta data and encapsulating access to the media stream for clients
to play media, not caring whether it is stored on your local hard disk or in the cloud.

The long term goal is to make this actually work for all kinds of media. My short term goal is driven by my
particular use case which is *listening to music stored in mp3 files on my nas at home from within the HTML5
browser at work*.


Status
------

* February 2012: Initial project. Not sensibly usable for anyone but me (in the current state not even for me).


Architecture
------------

### Requirements ###

The architecture is a result of the following requirements:

* Clean separation between player clients and the library which stores all the media meta data.
* The player client must be agnostic of physical location of media. It does not matter if media is stored on
my local hard drive or within the cloud.
* Gather some experience with RESTful API design.
* Gather some experience with server side JavaScript, in particular with respect to writing asynchronous
code following the node.js paradigm.
* Gather some experience with developing a modern web application.

### Central Concepts ###

``Library``: The library which is responsible for storing media meta data. Right now it is using couchdb for
storage. The storage mechanism should also remain pluggable (unless that turns out to be too academic a
premise).

``Service``: The service on top of the library which exposes access to media meta data in a restful manner.
The service also provides an API for streaming media. From the point of view of the client wanting to play
media, the service is the facade in front of the physical media source (local hard disk, cloud, etc.).

``Client (Player)``: The player uses the medialib service in order to browse/search media meta data as well
as for streaming media.

``Client (Cataloguer)``: The cataloguer uses the medialib service in order to add media meta data to the
library and in order to register physical media data locations with the library.  


Refer to the [content types description](medialib-server/blob/master/content_types.md) for details on how I
envision the service REST API. 

### Future ###

The medialib service should be easily extensible in order to provide additional features in the future such as:

* Server side cover art searching, maybe with Event-Channel into the Client over which events like *cover 
found for album xyz, please show the user and let him approve or disapprove* can be send.
* On the fly transcoding of media data.
* Server side searching for concerts of artists you are interested in at locations near your.
* Integration with last.fm or other services.


Companion Projects
------------------

This project only contains the medialib server components, that is, the Library and the Service. The clients
are contained in separate projects, which I will publish on github soon. Right now I am working on a browser
player client (HTML5) and a scanning client for my local music. 


Requirements
------------
* node v0.6.10
* couchdb v1.0.2.0


Utilities
---------
Also contains the following helpers, which may or may not be pulled out into separate modules in the future:

* ``assert``: assertions for basic coding by contract
