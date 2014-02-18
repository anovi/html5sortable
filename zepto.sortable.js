(function($) {

var dragging, placeholders = $();

var isOneOfThem = function( elem, items) {
  var element = elem.nodeType ? elem : elem[0];
  return $.inArray( element, items ) >= 0;
};

$.fn.zepto = true;

$.fn._initialPush = $.fn.push;

$.fn.push = function( elem ) {
  var set = this;
  if (elem instanceof Array) {
    for (var i = 0; i < elem.length; i++) {
      this.push( elem[i] );
    }
  } else if ( elem.zepto ) {
    elem.forEach(function( item ){
      set._initialPush( item );
    });
  } else {
    this._initialPush( elem );
  }
  return this;
};

var defaults = {
  // cursorAt
  // handle
  // appendTo: 'parent',
  helper: false,
  connectWith: false,
  forcePlaceholderSize: false
  // forceHelperSize
  // opacity
  // tolerance
    // "intersect": The item overlaps the other item by at least 50%.
    // "pointer": The mouse pointer overlaps the other item.
};


function Plugin( element, options ) {
  this.el          = element;
  this.$el         = $( element );
  this.isHandle    = false;
  this.options     = $.extend( {}, defaults, options );
  this.items       = $( element ).children( this.options.items );
  this.placeholder = $('<' + (/^ul|ol$/i.test(element.tagName) ? 'li' : 'div') + ' class="sortable-placeholder">');
  placeholders     = placeholders.push( this.placeholder );
  this.$el.data('h5selectable', this);
  if (this.options.connectWith) {
    $( this.options.connectWith ).data( 'h5selectable_connectWith', this.options.connectWith );
    this.$el.data( 'h5selectable_connectWith', this.options.connectWith );
  }
  this._init();
}


Plugin.prototype._init = function() {
  var _this = this;
  if ( this.options.handle ) {
    this.items.find( this.options.handle ).on( 'mousedown.h5s', function() {
      _this.isHandle = true;
    }).on( 'mouseup.h5s', function() {
      _this.isHandle = false;
    });
  }
  this.items.attr('draggable', 'true').on('dragstart.h5s', function(e) {
    return _this._onDragStart( e, this );
  });
  this.items.on('dragend.h5s', function(e) {
    return _this._onDragEnd( e, this );
  });
  this.items.not('a[href], img').on('selectstart.h5s', function() {
    if ( this.dragDrop ) { this.dragDrop(); }
    return false;
  });
  var onDragHandler = function(e) {
    return _this._onDrag( e, this );
  };
  this.items.on('dragover.h5s dragenter.h5s drop.h5s', onDragHandler);
  $([this.el, this.placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', onDragHandler);
};


Plugin.prototype._onDragStart = function( e, target ) {
  var dt;
  if (this.options.handle && !this.isHandle) { return false; }
  this.isHandle = false;
  dt = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;
  dt.effectAllowed = 'move';
  dt.setData('Text', 'dummy');
  this.index = (dragging = $(target)).addClass('sortable-dragging').index();
  // Set helper
  if ( this.options.helper ) {
    var top = this.options.cursorAt ? this.options.cursorAt.top : null,
        left = this.options.cursorAt ? this.options.cursorAt.left : null,
        helper = this.options.helper( target );
    // $( helper ).appendTo( (this.options.appendTo==='parent' ? this.el : this.options.appendTo) );
    dt.setDragImage( helper, left, top );
  } else if ( this.options.cursorAt ) {
    dt.setDragImage( target, this.options.cursorAt.left, this.options.cursorAt.top );
  }
};


Plugin.prototype._onDragEnd = function() {
  if (!dragging) { return; }
  dragging.removeClass('sortable-dragging').show();
  placeholders.remove();
  if (this.index !== dragging.index()) {
    dragging.parent().trigger('sortupdate', {item: dragging});
  }
  dragging = null;
};


Plugin.prototype._onDrag = function( e, target ) {
  var dt, $target;
  if (
    !isOneOfThem(dragging[0], this.items) && 
    this.options.connectWith !== $(dragging).parent().data('h5selectable_connectWith')
  ) { return true; }
  if (e.type === 'drop') {
    e.stopPropagation();
    placeholders.filter(':visible').after(dragging);
    dragging.trigger('dragend.h5s');
    return false;
  }
  dt = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;
  e.preventDefault();
  dt.dropEffect = 'move';
  $target = $(target);
  if ( isOneOfThem( target, this.items) ) {
    if (this.options.forcePlaceholderSize) {
      this.placeholder.height( dragging.height() );
    }
    dragging.hide();
    $target[this.placeholder.index() < $target.index() ? 'after' : 'before']( this.placeholder );
    placeholders.not(this.placeholder).remove();

  } else if ( !isOneOfThem(target, placeholders) && !$target.children(this.options.items).length ) {
    placeholders.remove();
    $target.append( this.placeholder );
  }
  return false;
};


Plugin.prototype.destroy = function() {
  this.$el.removeData( 'h5selectable_connectWith h5selectable' );
  this.items.removeData( 'h5selectable_connectWith' );
  this.items.find( this.options.handle ).off('mousedown.h5s mouseup.h5s');
  this.items.off( 'dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s' );  
  $([this.el, this.placeholder]).off('dragover.h5s dragenter.h5s drop.h5s');
};


Plugin.prototype.enable = function() {
  this.items.attr('draggable', true);
};


Plugin.prototype.disable = function() {
  this.items.attr('draggable', false);
};


Plugin._callPublicMethod = function( method ) {
  var publicMethod, args, _this = $(this).data('h5selectable');
  if( null === _this || void 0 === _this ) {
    throw new Error( 'Element ' + this[0] + ' has no plugin selectable.' );
  }
  publicMethod = _this[method];
  if ( publicMethod && $.isFunction( publicMethod ) && method.charAt(0) !== '_' ) {
    args = Array.prototype.slice.call( arguments );
    args.shift();
    return publicMethod.apply( _this, args );
  }
  throw new Error( 'Plugin selectable has no method \"' + method + '\"' );
};


$.fn.sortable = function( options ) {
  return this.each( function(key, elem) {
    if( options && options.charAt ) {
      return Plugin._callPublicMethod.apply( this, arguments );
    }
    if (!$(this).data('h5selectable')) { new Plugin(elem, options); }
  });
};

})( Zepto );
