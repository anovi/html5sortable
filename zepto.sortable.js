/*
 * HTML5 Sortable jQuery Plugin
 * http://farhadi.ir/projects/html5sortable
 * 
 * Copyright 2012, Ali Farhadi
 * Released under the MIT license.
 */
(function($) {
var dragging, placeholders = $();

var isOneOfThem = function( elem, items) {
  var element = elem.nodeType ? elem : elem[0];
  return $.fn.jquery ? items.is( elem ) : $.inArray( element, items ) >= 0;
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

if (!$.fn.jquery) {
  $.fn.detach = $.fn.remove;
}


$.fn.sortable = function( options ) {
  var method = String(options);
  
  options = $.extend({
    connectWith: false
  }, options);

  return this.each(function() {
    var items, isHandle, index, placeholder;
    
    if (/^enable|disable|destroy$/.test(method)) {
      items = $(this).children($(this).data('items')).attr('draggable', method === 'enable');
      if (method === 'destroy') {
        items
          .push( this )
          .removeData( 'connectWith items' )
          .off( 'dragstart.h5s dragend.h5s selectstart.h5s dragover.h5s dragenter.h5s drop.h5s' );
      }
      return;
    }

    items = $( this ).children( options.items );
    placeholder = $('<' + (/^ul|ol$/i.test(this.tagName) ? 'li' : 'div') + ' class="sortable-placeholder">');

    if ( options.handle ) {
      items.find( options.handle ).mousedown(function() {
        isHandle = true;
      }).mouseup(function() {
        isHandle = false;
      });
    }
    
    $(this).data('items', options.items);
    placeholders = placeholders.push( placeholder );
    if (options.connectWith) {
      $(options.connectWith).push( this )
      .data('connectWith', options.connectWith);
    }


    // Handler for dragstart
    items.attr('draggable', 'true').on('dragstart.h5s', function(e) {
      if (options.handle && !isHandle) {
        return false;
      }
      isHandle = false;
      var dt = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;
      dt.effectAllowed = 'move';
      dt.setData('Text', 'dummy');
      index = (dragging = $(this)).addClass('sortable-dragging').index();

    
    // Handler for dragend
    }).on('dragend.h5s', function() {
      if (!dragging) {
        return;
      }
      dragging.removeClass('sortable-dragging').show();
      placeholders.detach();
      if (index !== dragging.index()) {
        dragging.parent().trigger('sortupdate', {item: dragging});
      }
      dragging = null;

    
    // Handler selectstart
    }).not('a[href], img').on('selectstart.h5s', function() {
      if ( this.dragDrop ) { this.dragDrop(); }
      return false;
    });


    // Handler for drag enter over and drop
    var onDragMoving = function(e) {
      var dt;

      if (!isOneOfThem(dragging[0], items) && options.connectWith !== $(dragging).parent().data('connectWith')) {
        return true;
      }
      if (e.type === 'drop') {
        e.stopPropagation();
        placeholders.filter(':visible').after(dragging);
        dragging.trigger('dragend.h5s');
        return false;
      }
      dt = e.originalEvent ? e.originalEvent.dataTransfer : e.dataTransfer;
      e.preventDefault();
      dt.dropEffect = 'move';
      
      if ( isOneOfThem(this, items) ) {
        if (options.forcePlaceholderSize) {
          placeholder.height( dragging.height() );
        }
        dragging.hide();
        $( this )[placeholder.index() < $(this).index() ? 'after' : 'before']( placeholder );
        placeholders.not(placeholder).detach();

      } else if (!isOneOfThem(this, placeholders) && !$(this).children(options.items).length) {
        placeholders.detach();
        $(this).append( placeholder );
      }
      return false;
    };

    items.on('dragover.h5s dragenter.h5s drop.h5s', onDragMoving);
    // $().push([this, placeholder]).on('dragover.h5s dragenter.h5s drop.h5s', onDragMoving);
  });
};
})( Zepto );
