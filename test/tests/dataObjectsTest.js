"use strict";

describe("Zotero.DataObjects", function () {
	var types = ['collection', 'item', 'search'];
	
	describe("#getLibraryAndKeyFromID()", function () {
		it("should return a libraryID and key within a transaction", function* () {
			for (let type of types) {
				let objectsClass = Zotero.DataObjectUtilities.getObjectsClassForObjectType(type);
				yield Zotero.DB.executeTransaction(function* () {
					let obj = createUnsavedDataObject(type);
					yield obj.save();
					
					var {libraryID, key} = objectsClass.getLibraryAndKeyFromID(obj.id);
					assert.equal(libraryID, Zotero.Libraries.userLibraryID);
					assert.ok(key);
					assert.typeOf(key, 'string');
					assert.equal(key, obj.key);
					
					yield obj.erase();
				});
			}
		});
		
		it("should return false after a save failure", function* () {
			for (let type of types) {
				let objectsClass = Zotero.DataObjectUtilities.getObjectsClassForObjectType(type);
				var obj;
				try {
					yield Zotero.DB.executeTransaction(function* () {
						obj = createUnsavedDataObject(type);
						yield obj.save();
						throw 'Aborting transaction -- ignore';
					});
				}
				catch (e) {
					if (typeof e != 'string' || !e.startsWith('Aborting transaction')) throw e;
				}
				
				// The registered identifiers should be reset in a rollback handler
				var libraryKey = objectsClass.getLibraryAndKeyFromID(obj.id);
				assert.isFalse(libraryKey);
			}
		});
	});
	
	describe("#_setIdentifier", function () {
		it("should not allow an id change", function* () {
			var item = yield createDataObject('item');
			try {
				item.id = item.id + 1;
			}
			catch (e) {
				assert.equal(e.message, "ID cannot be changed");
				return;
			}
			assert.fail("ID change allowed");
		})
		
		it("should not allow a key change", function* () {
			var item = yield createDataObject('item');
			try {
				item.key = Zotero.DataObjectUtilities.generateKey();
			}
			catch (e) {
				assert.equal(e.message, "Key cannot be changed");
				return;
			}
			assert.fail("Key change allowed");
		})
		
		it("should not allow key to be set if id is set", function* () {
			var item = createUnsavedDataObject('item');
			item.id = Zotero.Utilities.rand(100000, 1000000);
			try {
				item.libraryID = Zotero.Libraries.userLibraryID;
				item.key = Zotero.DataObjectUtilities.generateKey();
			}
			catch (e) {
				assert.equal(e.message, "Cannot set key if id is already set");
				return;
			}
			assert.fail("ID change allowed");
		})
		
		it("should not allow id to be set if key is set", function* () {
			var item = createUnsavedDataObject('item');
			item.libraryID = Zotero.Libraries.userLibraryID;
			item.key = Zotero.DataObjectUtilities.generateKey();
			try {
				item.id = Zotero.Utilities.rand(100000, 1000000);
			}
			catch (e) {
				assert.equal(e.message, "Cannot set id if key is already set");
				return;
			}
			assert.fail("Key change allowed");
		})
		
		it("should not allow key to be set if library isn't set", function* () {
			var item = createUnsavedDataObject('item');
			try {
				item.key = Zotero.DataObjectUtilities.generateKey();
			}
			catch (e) {
				assert.equal(e.message, "libraryID must be set before key");
				return;
			}
			assert.fail("libraryID change allowed");
		})
	})
})
