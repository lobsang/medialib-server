Media Library
=============

A node.js application for managing media meta data and encapsulating access to the media stream for clients
to play media, not caring whether it is stored on your local hard disk or in the cloud.

The long term goal is to actually make this work for all kinds of media. My short term goal is driven by my
particular use case which is *listening to music stored in mp3 files on my nas at home from within the HTML5
browser at work*.

That short term goal also includes browsing and searching the library as well as using 3rd party web apis
for server-side cover art searching for media library contents.

It is my conviction, that there are lots of potential server-side services which add value to the media
library concept and which are independent of the physical location of media. As such this project is 
competition of sorts for the Amazon Cloud Player, or other open source projects like subsonic or Ampache.
However, those all have in common that they offer one monolithic solution where the service api is basically
coupled with the media location and where the clients are coupled to that service layer.

The intended target audience for this project is mainly...myself.


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

My personal objectives also drive the design as well as implementation choices:

* To gather some experience with RESTful API design.
* To gather some experience with server side JavaScript, in particular with respect to writing asynchronous
code following the node.js paradigm.
* To gather some experience with developing a modern web application.

I will also try to document decisions and noteworthy insights within my [musings](medialib-server/blob/master/dev/musings.md).

### Central Concepts ###

``Library``: The library encapsulates the whole domain of cataloging and storing media meta data. It is used 
by the service on top (which in turn provides the REST interface). Where the service talks about resources the 
library internally deals with entities. Right now it is using couchdb for storage of those entities. The 
storage mechanism should also remain pluggable.

``Service``: The service on top of the library which exposes access to media meta data in a restful manner.
The client uses this service to browse and search the contents within the library. It can also chose to play
media using this service. To that end this service provides an uniform interface for streaming media. It 
abstracts from the physical media source (local hard disk, cloud, etc.). Handlers for server-side access to
media must be pluggable.

``Client (Player)``: The player uses the medialib service in order to browse/search media meta data as well
as for streaming media.

``Client (Cataloger)``: The cataloger uses the medialib service in order to add media meta data to the
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
