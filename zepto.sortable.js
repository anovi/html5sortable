(function($) {

$.fn.zepto = $.fn.zepto || true;

var dragging, draggingMode, draggingOffsetFromCenter, placeholders = $(),

isOneOfThem = function( elem, items) {
  var element = elem.nodeType ? elem : elem[0];
  return $.inArray( element, items ) >= 0;
},

defaults = {
  // cursorAt
  // handle
  helper: false,
  connectWith: false,
  forcePlaceholderSize: false,
  tolerance: 'intersect',
  hideDragging: true
};


function Plugin( element, options ) {
  this.el          = element;
  this.$el         = $( element );
  this.isHandle    = false;
  this.options     = $.extend( {}, defaults, options );
  this.placeholder = $('<' + (/^ul|ol$/i.test(element.tagName) ? 'li' : 'div') + ' class="h5sortable-placeholder">');
  placeholders.push( this.placeholder[0] );
  this.$el.data('h5sortable', this);
  if (this.options.connectWith) {
    $( this.options.connectWith ).data( 'h5sortable_connectWith', this.options.connectWith );
    this.$el.data( 'h5sortable_connectWith', this.options.connectWith );
  }
  this._init();
}


Plugin.prototype._init = function() {
  var onDragHandler, _this = this;
  if ( this.options.handle ) {
    this.$el.on('mousedown.h5s', this.options.handle, function(e) {
      _this.isHandle = true;
      var offset = $( e.currentTarget ).offset();
      draggingOffsetFromCenter = offset.height/2 - (e.pageY - offset.top);
    })
    .on( 'mouseup.h5s', this.options.handle, function() {
      _this.isHandle = false;
    });

  } else {
    this.$el.on('mousedown.h5s', (this.options.items||'.h5sortable > *'), function(e) {
      var offset = $( e.currentTarget ).offset();
      draggingOffsetFromCenter = offset.height/2 - (e.pageY - offset.top);
    });
  }

  this.$el.children( this.options.items ).attr('draggable', 'true');

  this.$el.on('dragstart.h5s', (this.options.items||'.h5sortable > *'), function(e) {
    return _this._onDragStart( e, this );
  });
  this.$el.on('dragend.h5s', (this.options.items||'.h5sortable > *'), function(e) {
    return _this._onDragEnd( e, this );
  });
  this.$el.not('a[href], img').on('selectstart.h5s', function() {
    if ( this.dragDrop ) { this.dragDrop(); }
    return false;
  });
  onDragHandler = function(e) {
    return _this._onDrag( e, this );
  };
  this.$el.on('dragover.h5s dragenter.h5s drop.h5s', (this.options.items||'.h5sortable > *'), onDragHandler);
  $([this.el, this.placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', onDragHandler);
  this.$el.on('dragleave.h5s', function(e) {
    var draggingOffset;
    if (
      _this.dragging && (draggingOffset = _this.$el.offset()) &&
      !(draggingOffset.top <= e.pageY && e.pageY <= draggingOffset.top+draggingOffset.height &&
      draggingOffset.left <= e.pageX && e.pageX <= draggingOffset.left+draggingOffset.width)
    ) {
      _this.isHovered = false;
      _this._callEvent( 'out', e );
    }
  });
  this.$el.addClass('h5sortable');
  this._callEvent('created');
};


Plugin.prototype._onDragStart = function( e, target ) {
  var dt;
  if (this.options.handle && !this.isHandle) { return false; }
  this.isHandle = false;
  this.dragging = true;
  this.isHovered = true;
  dt = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;
  dt.effectAllowed = 'move';
  dt.setData('Text', 'dummy');
  this.index = (dragging = $(target)).addClass('h5sortable-dragging').index();
  if ( this.options.helper ) {
    var top = this.options.cursorAt ? this.options.cursorAt.top : null,
        left = this.options.cursorAt ? this.options.cursorAt.left : null,
        helper = this.options.helper( e, target );
    if (helper.tagName !== 'IMG') {
      this.helper = $(helper).css({
        position: 'absolute',
        top: 0,
        left: 0
      });
      this.$el.append( helper );
    }
    dt.setDragImage( helper, left, top );
  } else if ( this.options.cursorAt ) {
    dt.setDragImage( target, this.options.cursorAt.left, this.options.cursorAt.top );
  }
  this._callEvent('start',e);
};


Plugin.prototype._onDragEnd = function(e) {
  if (!dragging) { return; }
  dragging.removeClass('h5sortable-dragging').css('display',draggingMode);
  placeholders.remove();
  if (this.helper) {
    this.helper.remove();
    delete this.helper;
  }
  if (this.index !== dragging.index()) {
    this._callEvent('update',e);
    dragging.parent().trigger('sortupdate', {item: dragging});
  }
  this.dragging = false;
  dragging = null;
  draggingMode = null;
  this._callEvent('stop',e);
};


Plugin.prototype._isOwnItem = function(elem) {
  var $elem = $(elem),
  parents = $elem.parents();
  return isOneOfThem( this.el, parents );
};


Plugin.prototype._onDrag = function( e, target ) {
  var dt, $target, targetOffset, condition;
  if (
    !this._isOwnItem(dragging[0]) && 
    this.options.connectWith !== $(dragging).parent().data('h5sortable_connectWith')
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
  targetOffset = $target.offset();
  if ( this._isOwnItem(target) ) {
    if (this.options.forcePlaceholderSize) { this.placeholder.height(dragging.height()); }
    // if (this.helper) { this.helper.hide(); } //what is this?
    if (this.options.hideDragging) {
      draggingMode = draggingMode ? draggingMode : dragging.css('display');
      dragging.css('display','none');
    }
    if (e.type === 'dragenter' && !this.isHovered) {
      this.isHovered = true;
      this._callEvent('over', e);
    }
    condition = this.options.tolerance === 'intersect' ?
      (targetOffset.top + targetOffset.height / 2) < (e.pageY + draggingOffsetFromCenter) :
      (targetOffset.top + targetOffset.height / 2) < e.pageY;
    $target[condition ? 'after' : 'before']( this.placeholder );
    this.placeholder.show();
    placeholders.not(this.placeholder).remove();

  } else if ( !isOneOfThem(target, placeholders) && !$target.children(this.options.items).length ) {
    placeholders.remove();
    $target.append( this.placeholder );
    this.placeholder.show();
  }
  return false;
};


Plugin.prototype.destroy = function() {
  this.$el.removeData( 'h5sortable' );
  if (this.options.connectWith) { $( this.options.connectWith ).push(this.el).removeData('h5sortable_connectWith'); }
  this.$el.off('mousedown.h5s mouseup.h5s');
  this.$el.off( 'dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s' );  
  $([this.el, this.placeholder]).off('dragover.h5s dragenter.h5s drop.h5s');
  this.$el.off('mousedown.h5s dragleave.h5s');
  this.$el.removeClass('h5sortable');
  this.placeholder.remove();
  var index = $.inArray( this.placeholder, this.placeholder );
  this.placeholder.slice(index, index+1);
  delete this.placeholder;
};


Plugin.prototype.enable = function() { this.$el.children( this.options.items ).attr('draggable', true); };


Plugin.prototype.disable = function() { this.$el.children( this.options.items ).attr('draggable', false); };


Plugin.prototype._callEvent = function( name, event ) {
  var ui = {}, cb = this.options[name];
  if ( !cb ) { return; }
  if ( this.placeholder ) { ui.placeholder = this.placeholder; }
  if ( dragging ) { ui.item = dragging; }
  cb.call( this.$el, event || null, ui );
};


Plugin._callPublicMethod = function( method ) {
  var publicMethod, args, _this = $(this).data('h5sortable');
  if( null === _this || void 0 === _this ) {throw new Error( 'Element '+this+' has no plugin h5sortable.');}
  publicMethod = _this[method];
  if ( publicMethod && $.isFunction( publicMethod ) && method.charAt(0) !== '_' ) {
    args = Array.prototype.slice.call( arguments );
    args.shift();
    return publicMethod.apply( _this, args );
  }
  throw new Error( 'Plugin h5sortable has no method \"' + method + '\"' );
};


$.fn.sortable = function( options ) {
  var args = Array.prototype.slice.call( arguments );
  return this.each( function(key, elem) {
    if( options && options.charAt ) { return Plugin._callPublicMethod.apply(this, args); }
    if (!$(this).data('h5sortable')) { new Plugin(elem, options); }
  });
};

})( Zepto );
