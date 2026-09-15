import 'package:digital_student/features/media/models/student_media.dart';
import 'package:digital_student/l10n/app_localizations.dart';
import 'package:flutter/material.dart';

class PhotoGrid extends StatelessWidget {
  const PhotoGrid({
    super.key,
    required this.items,
    this.onOpen,
    this.emptyLabel,
  });

  final List<StudentMedia> items;
  final ValueChanged<StudentMedia>? onOpen;
  final String? emptyLabel;

  @override
  Widget build(BuildContext context) {
    if (items.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 24),
        child: Center(child: Text(emptyLabel ?? AppLocalizations.of(context).noPhotosYet)),
      );
    }
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth.isFinite
            ? (constraints.maxWidth - 8) / 2
            : 140.0;
        return Wrap(
          key: const Key('photoGrid'),
          spacing: 8,
          runSpacing: 8,
          children: [
            for (final item in items)
              SizedBox(
                width: width,
                height: width,
                child: Material(
                  color: Colors.black12,
                  child: InkWell(
                    key: Key('photoTile-${item.id}'),
                    onTap: onOpen == null ? null : () => onOpen!(item),
                    child:
                        item.thumbnailUrl == null || item.thumbnailUrl!.isEmpty
                        ? const Icon(Icons.photo)
                        : Image.network(
                            item.thumbnailUrl!,
                            fit: BoxFit.cover,
                            errorBuilder: (context, error, stack) =>
                                const Icon(Icons.photo),
                          ),
                  ),
                ),
              ),
          ],
        );
      },
    );
  }
}
