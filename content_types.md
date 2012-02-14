In all examples, headers which are not pertinent to the example are omitted (mostly Content-Length).

In order to improve readability I also did not enclose keys in json representations in quotation marks (which
means that, strictly speaking, it's not json). All trailing commas are artifacts of my sloppiness.

All urls are opaque as far as the client is concerned. That means, the structure of urls contained in links
must not be interpreted by the client (nor by you, the reader).


application/de.mlehmacher.medialib.Library+json
--------------------------------------------

```
{
   links: [
      { rel: "artists", url: "http://domain/artists" },
      { rel: "songs", url: "http://domain/songs" },
      { rel: "albums", url: "http://domain/albums" },
   ]
}
```


application/de.mlehmacher.medialib.Song+json
--------------------------------------------

A _song_ represents a collection of meta data for one atomic item of music within the media library.

```
{
   clientId: "/path/to/Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3",
   title: "The Czar (I. Usurper, II. Escape. III. Martyr, IV. Spiral)",
   album: "Crack The Skye",
   artist: "Mastodon",
   track: 4,
   genre: "Progressive Rock",
   length: 654.3412244897959,
   size: 17729550,
   year: 2009,
   links: [
      { rel: "self", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a" },
      { rel: "equal", url: "http://domain/songs/2e0c202270906df6d8dba1db8a11e3b34aea87d1" },
      { rel: "play/mp3", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources/0/play" },
      { rel: "play/ogg", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources/1/play" },
      { rel: "album", url: "http://domain/albums/11528c41f7d5cd48aa9063e73bbdeee9530128ec" },
      { rel: "artist", url: "http://domain/artists/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a" }
   ],
   actions: [   
       { effect: "createMediaResource", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources" },
       { effect: "mergeEqualSongsIntoSelf", url: "http://domain/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/merge?source=2e0c202270906df6d8dba1db8a11e3b34aea87d1" }
   ]
}
```

* `clientId`: An optional unique id (with respect to all other songs) supplied by the client. Uniqueness is
enforced by the server. Apart from that, its value is neither used nor interpreted by the server.

_[V 1.1]: album, track -> appearsOn: [ {album, track } ]; genre -> genres; artist -> artists_


application/de.mlehmacher.medialib.MediaResource+json
--------------------------------------------

A _media resource_ describes a physical, streamable media resource (doh!). The mp3 file on your local hard
disk is the media resource from which the song meta data is derived. The same song may have additional
physical reifications within a cloud or elsewhere (anywhere addressable).

```
{
   mediaType: "mp3",
   url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3"
}
```

Creating a media resources causes the following side effect to the representation of its owning song:

* Playback link will be added: `{rel: "play/mp3", url: "..."}`


### Client creates Song ###

Request:

    POST /songs
    Accept: application/de.mlehmacher.medialib.Song+json, application/de.mlehmacher.medialib.Error+json
    Content-Type: application/de.mlehmacher.medialib.Song+json
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
    Content-Type: application/de.mlehmacher.medialib.Song+json
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
          { rel: "self", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a" },
          { rel: "equal", url: "http://domain/songs/2e0c202270906df6d8dba1db8a11e3b34aea87d1" },
          { rel: "play/mp3", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources/0/play" }
       ],
       actions: [
          { effect: "createMediaResource", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources" },
          { effect: "mergeEqualSongsIntoSelf", url: "http://domain/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/merge?source=2e0c202270906df6d8dba1db8a11e3b34aea87d1" }
       ]
    }
    
### Client creates media source ###

Request:

    POST /songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources
    Accept: application/de.mlehmacher.medialib.MediaResource+json
    Content-Type: application/de.mlehmacher.medialib.MediaResource+json
    {
       mediaType: "mp3",
       url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3"
    }

Response:

    HTTP/1.1 201 Created
    Content-Type: application/de.mlehmacher.medialib.MediaResource+json
    {
       mediaType: "mp3",
       url: "file:///Mastodon-Crack_The_Skye-2009/04-mastodon-the_czar_(i_usurper_ii_escape_iii_martyr_iv_spiral).mp3",
       
       links: [
          { rel: "self", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources/0" },
          { rel: "play", url: "http://domain/songs/a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a/mediaResources/0/play" }
       ],
    }




**THE STUFF BELOW IS NOT YET FULLY FLESHED OUT - IT ONLY REPRESENTS ROUGH SKETCHES OF IDEAS**




application/de.mlehmacher.medialib.SongMerge+json
--------------------------------------------

Request (1):

    GET /songs/merge?src=urn%3Asong%3Aa0a5fc7e007e46f5227c41bc4447083ac3f5bf0a&target=urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc

Response (1):

    HTTP/1.1 200 OK
    Content-Type: application/de.mlehmacher.medialib.SongMerge+json 
    Last-Modified: ${Last-Modified}
    ETag: ${ETag}
    {
       source: { id: "urn:song:a0a5fc7e007e46f5227c41bc4447083ac3f5bf0a", ... },
       target: { id: "urn:song:4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc", ... }
    }


Request (2):

    POST /songs/merge?src=urn%3Asong%3Aa0a5fc7e007e46f5227c41bc4447083ac3f5bf0a&target=urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    Content-Type: application/de.mlehmacher.medialib.SongMerge+json
    If-Unmodified-Since: ${Last-Modified}
    If-Match: ${ETag}

Response (2):

    HTTP/1.1 201 Created
    Content-Type: application/de.mlehmacher.medialib.Song+json
    Location: /songs/urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    Content-Location: /songs/urn%3Asong%3A4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc
    {
       id: "urn:song:4447083ac3f5bf0a3Aa0a5fc7e007e46f5227c41bc",
       ...
    }


application/de.mlehmacher.medialib.Error+json
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


application/de.mlehmacher.medialib.Artist+json
--------------------------------------------

```
{
   id: "urn:artist:9a17fa4af00943939ce869b50d6e1fb3bc9e991a",
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
    Accept: application/de.mlehmacher.medialib.Artist+json, application/de.mlehmacher.medialib.Error+json
    Content-Type: application/de.mlehmacher.medialib.Artist+json
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
    Content-Type: application/de.mlehmacher.medialib.Artist+json
    {
    }


application/de.mlehmacher.medialib.Album+json
--------------------------------------------

```
{
   id: "urn:album:11528c41f7d5cd48aa9063e73bbdeee9530128ec",
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


application/de.mlehmacher.medialib.Cover+json
--------------------------------------------

```
{
   id: "urn:cover:4447083ac3f5bf0ba0a5fc7e007e46f5227c41bc",
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
