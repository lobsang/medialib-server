
My latest insights are not reflected here. It has been brought to my attention that media types are the means 
by which hypermediality is achieved. The intention of a media type is not to describe the structure of 
representations but to let the client know how it can extract hypermedia from the body of a response and which 
operations apply.

It follows from that insight, that the media types described below need overhauling. Contrary to the current 
design I am going to opt for one domain media type only.



In all examples, headers which are not pertinent to the example are omitted (mostly Content-Length).

In order to improve readability I also did not enclose keys in json representations in quotation marks (which
means that, strictly speaking, it's not json). All trailing commas are artifacts of my sloppiness.

All urls are opaque as far as the client is concerned. That means, the structure of urls contained in links
must not be interpreted by the client (nor by you, the reader).


application/medialib.Library+json
--------------------------------------------

```
{
   links: [
      { url: "...", rel: "artists", description: "artists contained within this library" },
      { url: "...", rel: "songs", description: "songs contained within this library" },
      { url: "...", rel: "albums", description: "albums contained within this library" },
   ]
}
```


application/medialib.Song+json [Song.orderly](lib/medialib/service/validation/Song.orderly)
--------------------------------------------

A _song_ represents a collection of meta data for one atomic item of music within the media library.

```
{
   clientID: "/path/to/Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3",
   title: "The Czar (I. Usurper, II. Escape. III. Martyr, IV. Spiral)",
   album: "Crack The Skye",
   artist: "Mastodon",
   track: 4,
   genre: "Progressive Rock",
   length: 654.3412244897959,
   size: 17729550,
   year: 2009,
   links: [
      { url: "...", rel: "self", description: "this song's uri" },
      { url: "...", rel: "library", description: "the library containing this song" },
      { url: "...", rel: "mediaFiles", description: "media files associated with this song" },
      { url: "...", rel: "equal", description: "a song which according to server algorithms may be equal to this song" },
      { url: "...", rel: "album", description: "an album containing this song" },
      { url: "...", rel: "artist", description: "an artist participating in this song" }
   ]
}
```

* `clientID`: An optional unique id (with respect to all other songs) supplied by the client. Uniqueness is
enforced by the server. Apart from that, its value is neither used nor interpreted by the server.

_[V 1.1]: album, track -> appearsOn: [ {album, track } ]; genre -> genres; artist -> artists_


application/medialib.MediaFile+json
--------------------------------------------

A _media file_ describes a physical, streamable media resource. The mp3 file on your local hard drive is the 
media file from which the song meta data is derived. The same song may have additional physical reifications 
within a cloud or elsewhere (anywhere addressable).

```
{
   format: "mp3",
   url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3",   
   links: [
      { url: "...", rel: "self", description: "this media file's uri" },
      { url: "...", rel: "stream", meta: { transform: "identity", mediaType: "audio/mpeg" }, description: "a media stream" }
      { url: "...", rel: "stream", meta: { transform: "transcode", quality: "high", mediaType: "application/ogg" }, description: "a media stream" }
   ],
}
```

```
{
   format: "vorbis",
   url: "acd:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).ogg",   
   links: [
      { url: "...", rel: "self", description: "this media file's uri" },
      { url: "...", rel: "stream", meta: { transform: "identity", mediaType: "application/ogg" }, description: "a media stream" }
   ],
}
```

### Client creates Song ###

Request:

    POST /songs
    Accept: application/medialib.Song+json, application/medialib.Error+json
    Content-Type: application/medialib.Song+json
    {
       title: "The Czar (I. Usurper, II. Escape. III. Martyr, IV. Spiral)",
       album: "Crack The Skye",
       track: 4,
       artist: "Mastodon",
       genre: "Progressive Rock",
       length: 654.3412244897959,
       size: 17729550,
       year: 2009
    }

Response:

    HTTP/1.1 201 Created
    Content-Type: application/medialib.Song+json
    {
       title: "The Czar (I. Usurper, II. Escape. III. Martyr, IV. Spiral)",
       album: "Crack The Skye",
       artist: "Mastodon",
       track: 4,
       genre: "Progressive Rock",
       length: 654.3412244897959,
       size: 17729550,
       year: 2009,
       links: [
     	    { url: "...", rel: "self", description: "this song's uri" },
     	    { url: "...", rel: "library", description: "the library containing this song" },
     	    { url: "...", rel: "mediaFiles", description: "media files associated with this song" },
     	    { url: "...", rel: "album", description: "an album containing this song" },
     	    { url: "...", rel: "artist", description: "an artist participating in this song" },
       ]
    }
    
### Client creates media file ###

Request:

    POST $( songRepr.links[ @rel = "mediaFiles" ] )
    Accept: application/medialib.MediaFile+json
    Content-Type: application/medialib.MediaFile+json
    {
       format: "mp3",
       url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3"
    }

Response:

    HTTP/1.1 201 Created
    Content-Type: application/medialib.MediaFile+json
    {
       format: "mp3",
       url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3",
       
       links: [
          { url: "...", rel: "self", description: "this media file's uri" },
          { url: "...", rel: "stream", meta: { transform: "identity", mediaType: "audio/mpeg" }, description: "a media stream" }
        ],
    }




**THE STUFF BELOW IS NOT YET FULLY FLESHED OUT - IT ONLY REPRESENTS ROUGH SKETCHES OF IDEAS**




application/medialib.SongMerge+json
--------------------------------------------

Request (1):

    GET /songs/merge?src=urn%3Asong%3Aa0a5fc7e007e46f5227c41bc4447083ac3f5bf0a&target=urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc

Response (1):

    HTTP/1.1 200 OK
    Content-Type: application/medialib.SongMerge+json 
    Last-Modified: ${Last-Modified}
    ETag: ${ETag}
    {
       source: { id: "urn:song:a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a", ... },
       target: { id: "urn:song:4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc", ... }
    }


Request (2):

    POST /songs/merge?src=urn%3Asong%3Aa0a5fc7e007e46f5227c41bc4447083ac3f5bf0a&target=urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    Content-Type: application/medialib.SongMerge+json
    If-Unmodified-Since: ${Last-Modified}
    If-Match: ${ETag}

Response (2):

    HTTP/1.1 201 Created
    Content-Type: application/medialib.Song+json
    Location: /songs/urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    Content-Location: /songs/urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    {
       id: "urn:song:4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc",
       ...
    }


application/medialib.Error+json
--------------------------------------------

```
{
   op: "SongCreation",
   causes: [
      {
         type: "constraintViolation",
         text: "Uniqueness constraint violated for attribute "clientId"" 
      }
   ]
}
```


application/medialib.Artist+json
--------------------------------------------

```
{
   clientId: "Mastodon",
   name: "Mastodon"
   links: [
      { rel: "self", url: "http://domain/?artist=9a17fa4af00943939ce869b50d6e1fb3bc9e991a" }
      { rel: "album", url: "http://domain/?album=11528c41f7d5cd48aa9063e73bbdeee9530128ec" },
      { rel: "album", url: "http://domain/?album=MastodonTheHunter2011" },
   ],
   actions: [
      { type: "createSong", url: "http://domain/artists/9a17fa4af00943939ce869b50d6e1fb3bc9e991a/createSong" },
      { type: "createAlbum", url: "http://domain/artists/9a17fa4af00943939ce869b50d6e1fb3bc9e991a/createAlbum" }
   ]
}
```

### Client creates Artist ###

Request:

    POST /artists/
    Accept: application/medialib.Artist+json, application/medialib.Error+json
    Content-Type: application/medialib.Artist+json
    {
       clientId: "Mastodon",
       name: "Mastodon"
       links: [
          { rel: "self", url: "http://domain/?artist=9a17fa4af00943939ce869b50d6e1fb3bc9e991a" }
          { rel: "album", url: "http://domain/?album=11528c41f7d5cd48aa9063e73bbdeee9530128ec" },
          { rel: "album", url: "http://domain/?album=MastodonTheHunter2011" },
       ],
    }

Response:

    HTTP/1.1 201 Created
    Content-Type: application/medialib.Artist+json
    {
    }


application/medialib.Album+json
--------------------------------------------

```
{
   name: "Crack The Skye",
   links: [
      { rel: "self", url: "http://domain/?album=11528c41f7d5cd48aa9063e73bbdeee9530128ec" },
      { rel: "artist", url: "http://domain/?artist=9a17fa4af00943939ce869b50d6e1fb3bc9e991a" },
      { rel: "cover", url: "http://domain/?cover=xxx" },
      { rel: "cover", url: "http://domain/?cover=xxx" },
      { rel: "song", url: "http://domain/?song=xxx" },
      { rel: "song", url: "http://domain/?song=xxx" },
      { rel: "song", url: "http://domain/?song=xxx" },
      { rel: "song", url: "http://domain/?song=a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a" },
      { rel: "song", url: "http://domain/?song=xxx" },
      { rel: "song", url: "http://domain/?song=xxx" },
   ],
}
```

* `links`: `rel: "song"`: [1..*], one for each song of the album, ordered by `Song.track`

    `rel: "artists"`: [1..*], one for each artist participating in songs of the album


application/medialib.Cover+json
--------------------------------------------

```
{
   size: "medium",
   dataType: "image/png;base64",
   data: "Djwx5GHITgM9GGgDx+HgT4M9GGgDx+HgT4M9OHjvwbov/71r4eBPuDHn",
	status: "waitingForApproval",
   links: [
      { rel: "artist", url: "http://domain/?artist=Mastodon" },
      { rel: "album", url: "http://domain/?album=MastodonCrackTheSkye2010" },
      { rel: "originalSource", url: "http://ecx.images-amazon.com/images/I/31aZ-uUbx3L._SL160_.jpg" }
   ]
}
```

* `size`: one of `small`, `medium`, `large`
* `status`: one of `waitingForApproval`, `approved`, `rejected`
