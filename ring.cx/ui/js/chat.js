
/* TODO:
 *  store / load mime_type in chat history
 *  add profile image
 *  chatHistory: hide same user image if the last history item is his
 */

/* FIXME:
 * ensure saving chat history if sent / received quickly
 * enter key to create / update contact
 * search not working without refresh on update / create contact
 */

// HTML elements of the page

var htmlChatHistory = document.getElementById('chatHistory'),
    htmlContacts = document.getElementById('contacts'),
    htmlContact = document.getElementsByClassName('contact'),
    htmlAddContact = document.getElementById('addContact');

// Global variables

// TODO load from cookies after account wizard is coded

var ringApiHttp = 'http:/127.0.0.1:8080/',
    ringApiWs = new WebSocket("ws://127.0.0.1:5678/"),
    currentAccountId  = '2dcb4c8fd4cee100',
    currentContactId = null;

// Init: ensures it is called before Semantic Search callback

initLocalStorage();
initContacts();
initChatHistory();

// Global functions

function initChatHistory()
{
    loadContactChatHistory();
    $('#chatReply input').focus();
    scrolldownChatHistory();
}

function talkToContact(ringId)
{
    // set current background to default
    var htmlContact = document.getElementById(currentContactId);
    if (htmlContact)
    {
        htmlContact.style.background = '#d7f5f0';
    }

    // set new interlocutor as current
    currentContactId = ringId;
    htmlContact = document.getElementById(currentContactId);

    // set new interlocutor background to focused
    if (htmlContact)
    {
        htmlContact.style.background = '#cbf2eb';
    }

    initChatHistory()
}

function addChatHistoryItem(item, side, hideImage=false)
{
    var chatHistoryItem = htmlBuilder.chatHistoryItem(
        item.message, side, hideImage);
    htmlChatHistory.appendChild(chatHistoryItem);
}

function scrolldownChatHistory()
{
    $('#chatHistory').animate({
        scrollTop: $('#chatHistory').prop("scrollHeight")
    }, 0);
}

function loadContactChatHistory()
{
    htmlChatHistory.innerHTML = '';

    var chatHistory = ringLocalStorage.accountContactHistory(
        currentAccountId, currentContactId);

    for (var key in chatHistory)
    {
        var item = chatHistory[key],
            side = 'left';

        if (item.messageStatus == 'sent')
        {
            side = 'right';
        }

        addChatHistoryItem(item, side, false);
    }
}

// User Events listeners

// Chat

$('#chatReply').keypress(function(e)
{
    if (e.keyCode == 13) // Enter
    {
        var message = '<p>' + $('#chatReply input').val() + '</p>',
            messageStatus = 'sent';

        /*
        $.ajax({
            type: 'POST',
            url: ringApiHttp + 'account/' + currentAccountId + '/message/',
            data: {
                ring_id: currentContactId,
                mime_type: 'text/plain',
                message: message
            },
            sucess: function(data)
            {
                console.log(data);
                return;
                ringLocalStorage.addAccountContactHistory(currentAccountId,
                    currentContactId, messageStatus, message);

                var chatHistoryItem = htmlBuilder.chatHistoryItem(message, 'right');
                htmlChatHistory.appendChild(chatHistoryItem);

            }
        });
        */
        // save to storage
        ringLocalStorage.addAccountContactHistory(currentAccountId,
            currentContactId, messageStatus, message);

        // add to html
        var chatHistoryItem = htmlBuilder.chatHistoryItem(message, 'right');
        htmlChatHistory.appendChild(chatHistoryItem);

        // reset input
        $('#chatReply input').val('');
    }
});

// Contacts

$('.ui.search')
    .search({
        source: ringSemantic.accountContactsSearchFormat(currentAccountId),
        searchFields: [
            'ringId', 'name', 'lastname'
        ],
        fields: {
            categories      : 'results',     // array of categories (category view)
            categoryName    : 'name',        // name of category (category view)
            categoryResults : 'results',     // array of results (category view)
            description     : 'description', // result description
            results         : 'results',     // array of results (standard)
            title           : 'title'        // result title
        },
        onSelect: function(result)
        {
            talkToContact(result.ringId);
        },
    })
;
$('.ui.search .results').css({'width': '100%'});

function selectContact()
{
    var ringId = this.id;
    talkToContact(ringId);
}

function updateContact()
{
    var contactId = $(this).parent()[0].id;
    talkToContact(contactId);

    var contact = ringLocalStorage.accountContact(
        currentAccountId, currentContactId);

    if (!contact.profile)
    {
        throw new Error('Contact has no profile');
    }

    // Setup the Contact Modal
    $('#contactModalHeader').text('Update Contact');
    $('#contactModalDeny').text('Delete');
    $('#contactModalError').hide();
    $('#contactModalName').val(contact.profile.name);
    $('#contactModalLastname').val(contact.profile.lastname);
    $('#contactModalRingId').val(currentContactId);

    $('#contactModal').modal({
        // update
        onApprove: function() {

            var ringId = $('#contactModalRingId').val();

            // Updated Ring ID
            if (ringId != currentContactId)
            {
                var existingContact = ringLocalStorage.accountContact(
                    currentAccountId, ringId);

                if (existingContact)
                {
                    $('#contactModalErrorHeader').text('Not a new contact');
                    $('#contactModalErrorMessage').text(
                        'There is a contact with the same Ring ID. ' +
                        'Please, modify the existing one.'
                    );
                    $('#contactModalError').show();
                    $('#contactModal').show();
                    return false;
                }
                // New Ring Id means we have to delete the current
                ringLocalStorage.deleteAccountContact(
                    currentAccountId, currentContactId);

                // Update HTML
                document.getElementById(currentContactId).id = ringId;
            }

            // Build profile for ringLocalStorage.saveAccountContact()
            var profile = contact.profile;
            profile.ringId = ringId;
            profile.name = $('#contactModalName').val();
            profile.lastname = $('#contactModalLastname').val();

            // Update HTML
            $('#' + ringId + ' .text').html(
                profile.name + ' ' + profile.lastname);

            ringLocalStorage.saveAccountContact(currentAccountId, profile);
        },
        // delete
        onDeny: function() {
            ringLocalStorage.deleteAccountContact(
                currentAccountId, currentContactId);
            document.getElementById(currentContactId).remove();
        }
    }).modal('show');
}

function addContact()
{
    var contact = {};
    contact.name = $('#contactModalName').val();
    contact.lastname = $('#contactModalLastname').val();
    contact.ringId = $('#contactModalRingId').val();

    // Validate contact existence
    var htmlContact = document.getElementById(contact.ringId);
    if (htmlContact)
    {
        $('#contactModalErrorHeader').text('Not a new contact');
        $('#contactModalErrorMessage').text(
            'There is a contact with the same Ring ID. ' +
            'Please, modify the existing one.'
        );
        $('#contactModalError').show();
        $('#contactModal').show();

        return false;
    }
    // Ensure data persistence using Local Storage
    ringLocalStorage.saveAccountContact(currentAccountId, contact);

    // Add new contact to HTML UI
    htmlContact = htmlBuilder.contact(
        contact.ringId, contact.name + ' ' + contact.lastname);
    htmlContact.addEventListener('click', selectContact, false);
    var contactsItemOptions = htmlContact.childNodes[2];
    contactsItemOptions.addEventListener(
        'click', updateContact, false);
    htmlContacts.insertBefore(htmlContact, htmlAddContact);

    talkToContact(contact.ringId);

    return true;
}

$('#addContact').click(function()
{
    $('#contactModalHeader').text('New Contact');
    $('#contactModalError').hide();
    $('#contactModalDeny').text('Cancel');
    $('#contactModalName').val('');
    $('#contactModalLastname').val('');
    $('#contactModalRingId').val('');

    $('#contactModal').modal({
        onApprove: addContact
    }).modal('show');
});

$('#contactModalErrorClose').click(function(){
    $('#contactModalError').hide();
});

/* // FIXME
$('#contactModal').keypress(function(e)
{
    if (e.keyCode == 13) // Enter
    {
        if(addContact())
        {
            $('#contactModal').modal('hide');
        }
    }
});
*/

// Websockets callbacks

ringApiWs.onmessage = function(event)
{
    var data = JSON.parse(event.data);

    if (data.account_message)
    {
        var message = data.account_message,
            messageStatus = 'received',
            ringId = message.from_ring_id,
            content = message.content;

        var contact = ringLocalStorage.accountContact(currentAccountId, ringId);

        if (contact)
        {
            var textPlain = content['text/plain']; // TODO change: see top list

            // save to storage
            ringLocalStorage.addAccountContactHistory(
                currentAccountId, ringId, messageStatus, textPlain);

            // add to html
            var chatHistoryItem = htmlBuilder.chatHistoryItem(
                textPlain, 'left');
            htmlChatHistory.appendChild(chatHistoryItem);
        }
    }
};

ringApiWs.onopen = function(event)
{
    console.log('Ring API websocket opened');
};

ringApiWs.onclose = function(event)
{
    console.log('Ring API websocket closed');
};

// Initializing

function initContacts()
{
    var accountContacts = ringLocalStorage.accountContacts(currentAccountId);

    if (Object.keys(accountContacts).length)
    {
        for (var ringId in accountContacts)
        {
            var profile = accountContacts[ringId]['profile'];
            if (profile)
            {
                htmlContact = htmlBuilder.contact(ringId,
                    profile.name + ' ' + profile.lastname);
                htmlContact.addEventListener('click', selectContact, false);

                contactsItemOptions = htmlContact.childNodes[2];
                contactsItemOptions.addEventListener(
                    'click', updateContact, false);

                htmlContacts.insertBefore(htmlContact, htmlAddContact);
            }
        }
        // set first contact as 'talk to'
        talkToContact(Object.keys(accountContacts)[0]);
    }
}

// TODO move to account wizard creation
function initLocalStorage()
{
    var data = JSON.parse(localStorage.getItem('ring.cx')),
        account = null;

    if (!data)
    {
        data = {};
    }
    else
    {
        account = data[currentAccountId];
    }
    if (!account)
    {
        data[currentAccountId] = {
            'contacts': {}
        };
        localStorage.setItem('ring.cx', JSON.stringify(data));
    }
}

