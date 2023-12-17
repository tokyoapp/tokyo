import SwiftRs
import Tauri
import UIKit
import WebKit

class ExamplePlugin: Plugin {
  @objc public func get_locations(_ invoke: Invoke) throws {

    // TODO: get locations list from persistent storage, maybe sqlite3

    // // https://developer.apple.com/documentation/uikit/view_controllers/providing_access_to_directories
    // // Create a document picker for directories.
    // let documentPicker =
    //   UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
    // documentPicker.delegate = self

    // // Set the initial directory.
    // documentPicker.directoryURL = startingDirectory

    // // Present the document picker.
    // present(documentPicker, animated: true, completion: nil)

    let value = invoke.getString("value")
    invoke.resolve(["value": value as Any])
  }

}

@_cdecl("init_plugin_library")
func initPlugin() -> Plugin {
  return ExamplePlugin()
}
