import SwiftRs
import Tauri
import UIKit
import WebKit

class ExamplePlugin: Plugin {
  // @objc public func get_list(_ invoke: Invoke) throws {
  //   let value = invoke.getString("value")
  //   invoke.resolve(["value": value as Any])
  // }

  // @objc public func open(_ invoke: Invoke) throws {
  //   // https://developer.apple.com/documentation/uikit/view_controllers/providing_access_to_directories
  //   // Create a document picker for directories.
  //   let documentPicker =
  //     UIDocumentPickerViewController(forOpeningContentTypes: [.folder])
  //   documentPicker.delegate = self

  //   // Set the initial directory.
  //   documentPicker.directoryURL = startingDirectory

  //   // Present the document picker.
  //   present(documentPicker, animated: true, completion: nil)
  // }
}

@_cdecl("init_plugin_library")
func initPlugin() -> Plugin {
  return ExamplePlugin()
}
