
var htmlBuilder = {};

htmlBuilder.chatHistoryItem = function(text, cssFloat, hideImage=false)
{
    var chatHistoryItem = document.createElement("div"),
        chatHistoryItemImage = document.createElement("div"),
        chatHistoryItemText = document.createElement("div");

    chatHistoryItem.className = "chatHistoryItem";
    chatHistoryItemImage.className = "chatHistoryItemImage";
    chatHistoryItemText.className = "chatHistoryItemText";

    if (!hideImage)
    {
        chatHistoryItemImage.innerHTML = '<i class="huge spy icon"></i>';
    }
    chatHistoryItemText.innerHTML = text;

    chatHistoryItemImage.style.cssFloat = cssFloat;
    chatHistoryItemText.style.cssFloat = cssFloat;

    chatHistoryItem.appendChild(chatHistoryItemImage);
    chatHistoryItem.appendChild(chatHistoryItemText);

    return chatHistoryItem;
}

htmlBuilder.contact = function(id, firstLastNames, imageSrc=null)
{
    var contacts = document.createElement('div'),
        image = document.createElement('img'),
        text = document.createElement('i');
        options = document.createElement('i');

    contacts.id = id;

    contacts.className = 'ui label contact';
    image.className = 'ui right spaced avatar image';
    text.className = 'text';
    options.className = 'large ellipsis vertical icon options';

    if (!imageSrc)
    {
        image.src = 'images/avatar/large/white-image.png';
    }
    text.innerHTML = firstLastNames;

    contacts.appendChild(image);
    contacts.appendChild(text);
    contacts.appendChild(options);

    return contacts;
}

