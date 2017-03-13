/**
 * @overview not <i>ccm</i> framework relevant helper functions for <i>ccm</i> component developers
 * @author André Kless <andre.kless@web.de> 2016
 * @license The MIT License (MIT)
 */

ccm.helper.integrate( {

  /**
   * @summary removes all keys in an object that have falsy values
   * @param {object} obj - object
   * @returns {object} cleaned object (not cloned)
   * @example
   * // example with using return value
   * var obj = ccm.helper.cleanObject( { foo: '', bar: false, baz: null, test: undefined, i: 0, abc: 'xyz' } );
   * console.log( obj );  // => { abc: 'xyz' }
   * @example
   * // example without using return value
   * var obj = { foo: '', bar: false, baz: null, test: undefined, i: 0, abc: 'xyz' }
   * ccm.helper.cleanObject( obj );
   * console.log( obj );  // => { abc: 'xyz' }
   */
  cleanObject: function ( obj ) {

    for ( var key in obj )
      if ( !obj[ key ] )
        delete obj[ key ];
    return obj;

  },

  /**
   * @summary converts dot notations in object keys to deeper properties
   * @param {object} obj - contains object keys in dot notation
   * @returns {object} object with converted object keys
   * @example
   * var obj = { test: 123, 'foo.bar': 'abc', 'foo.baz': 'xyz' };
   * var result = ccm.helper.convertObjectKeys( obj );
   * console.log( result );  // => { test: 123, foo: { bar: 'abc', baz: 'xyz' } }
   */
  convertObjectKeys: function ( obj ) {

    var keys = Object.keys( obj );
    keys.map( function ( key ) {
      if ( key.indexOf( '.' ) !== -1 ) {
        ccm.helper.deepValue( obj, key, obj[ key ] );
        delete obj[ key ];
      }
    } );
    return obj;

  },

  /**
   * @summary gets the input data of a HTML form
   * @param {ccm.types.element} form - HTML element of the HTML form
   * @returns {object} input data
   * @example
   * var result = ccm.helper.formData( document.getElementsById( 'form_id' ) );
   * console.log( result );  // { username: 'JohnDoe', password: '1aA' }
   */
  formData: function ( form ) {

    var data = {};
    var iterator = new FormData( form ).entries();
    var pair;
    while ( pair = iterator.next().value ) {
      var checkbox = form.querySelector( 'input[type=checkbox][name="' + pair[ 0 ] + '"]' );
      if ( checkbox && !checkbox.getAttribute( 'value' ) ) pair[ 1 ] = true;
      var number = form.querySelector( 'input[type=number][name="' + pair[ 0 ] + '"]' );
      if ( number ) pair[ 1 ] = parseInt( pair[ 1 ] );
      data[ pair[ 0 ] ] = pair[ 1 ];
    }
    return data;

  },

  /**
   * @summary returns a <i>ccm</i> loading icon as HTML node element
   * @param {ccm.instance} instance - <i>ccm instance</i> (for determining Shadow DOM)
   * @types {ccm.types.node}
   * @example document.body.appendChild( ccm.helper.loading() );
   */
  loading: function ( instance ) {

    // set keyframe for ccm loading icon animation
    if ( !instance.element.parentNode.querySelector( '#ccm_keyframe' ) ) {
      var style = document.createElement( 'style' );
      style.id = 'ccm_keyframe';
      style.appendChild( document.createTextNode( '@keyframes ccm_loading { to { transform: rotate(360deg); } }' ) );
      instance.element.parentNode.appendChild( style );
    }

    return ccm.helper.html( { class: 'ccm_loading', inner: { style: 'display: inline-block; width: 0.5em; height: 0.5em; border: 0.15em solid #009ee0; border-right-color: transparent; border-radius: 50%; animation: ccm_loading 1s linear infinite;' } } );
  },

  /**
   * @summary performs minor finish actions
   * @param {ccm.types.instance} instance - finished <i>ccm</i> instance
   * @param {function|object} instance.onFinish - finish callback or settings for minor finish actions
   * @param {ccm.types.instance} [instance.onFinish.user] - <i>ccm</i> user instance
   * @param {ccm.types.key} [instance.onFinish.key] - dataset key for result data
   * @param {ccm.types.settings} [instance.onFinish.store_settings] - settings for a <i>ccm</i> datastore (result data will be set in this datastore)
   * @param {object} [instance.onFinish.permissions] - permission settings for set operation
   * @param {boolean} [instance.onFinishn.user_specific] - do the set operation with a user-specific dataset key
   * @param {boolean} [instance.onFinish.restart] - restart finished <i>ccm</i> instance
   * @param {callback} [instance.onFinish.callback] - additional individual finish callback (will be called after the performed minor actions)
   * @param {object} results - result data
   */
  onFinish: function ( instance, results ) {

    // has only function? => abort and call it as finish callback
    if ( typeof instance.onFinish === 'function' ) return instance.onFinish( instance, results );

    // has user instance? => login user
    if ( instance.onFinish.user ) instance.onFinish.user.login( proceed ); else proceed();

    function proceed() {

      // has to add a dataset key to result data? => do it (if not already exists)
      if ( instance.onFinish.key && !results.key ) results.key = instance.onFinish.key;

      // has to store result data in a ccm datastore?
      if ( instance.onFinish.store_settings ) {

        /**
         * dataset which contains resulting data
         * @type {ccm.types.dataset}
         */
        var dataset = ccm.helper.clone( results );

        // has to add permission settings? => do it
        if ( instance.onFinish.permissions ) dataset._ = instance.onFinish.permissions;

        // need user-specific dataset? => make dataset key user-specific
        if ( instance.onFinish.user && instance.onFinish.user_specific ) dataset.key = [ dataset.key || ccm.helper.generateKey(), instance.onFinish.user.data().key ];

        // set dataset in ccm datastore
        ccm.set( instance.onFinish.store_settings, dataset, proceed );

      } else proceed();

      function proceed() {

        // has to restart the ccm instance? => do it
        if ( instance.onFinish.restart ) instance.start( proceed ); else proceed();

        function proceed() {

          // has to a perform a callback? => do it
          if ( instance.onFinish.callback ) instance.onFinish.callback( instance, results );

        }

      }

    }

  },

  protect: function ( value ) {
    if ( ccm.helper.isElementNode( value ) ) {
      ccm.helper.makeIterable( value.getElementsByTagName( 'script' ) ).map( function ( script ) {
        script.parentNode.removeChild( script );
      } );
      return value;
    }
    if ( typeof value === 'string' ) {
      var tag = document.createElement( 'div' );
      tag.innerHTML = value;
      ccm.helper.makeIterable( tag.getElementsByTagName( 'script' ) ).map( function ( script ) {
        script.parentNode.removeChild( script );
      } );
      return tag.innerHTML;
    }
  },

  removeElement: function ( element ) {
    if ( element.parentNode ) element.parentNode.removeChild( element );
  },

  /**
   * @summary set the content of an HTML element
   * @param {ccm.types.element} element - HTML element
   * @param {string|ccm.types.element|ccm.types.element[]} content - HTML element or HTML string for content
   */
  setContent: function ( element, content ) {

    if ( typeof content === 'object' ) {
      element.innerHTML = '';
      if ( Array.isArray( content ) )
        content.map( function ( node ) { element.appendChild( node ); } );
      else
        element.appendChild( content );
    }
    else element.innerHTML = content;

  },

  /**
   * @summary performs a function after a waiting time
   * @param {number} time - waiting time in milliseconds
   * @param {function} callback - performed function after waiting time
   * @example ccm.helper.wait( 1000, function () { console.log( 'I was called after 1 second' ) } );
   */
  wait: function ( time, callback ) {
    window.setTimeout( callback, time );
  }

}, ccm.helper );