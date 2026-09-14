import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter/material.dart';

class ChildSelector extends StatelessWidget {
  const ChildSelector({
    super.key,
    required this.children,
    required this.selectedId,
    required this.onSelected,
  });

  final List<ParentChild> children;
  final String? selectedId;
  final ValueChanged<String> onSelected;

  @override
  Widget build(BuildContext context) {
    if (children.length < 2) {
      return const SizedBox.shrink();
    }
    return SingleChildScrollView(
      key: const Key('childSelector'),
      scrollDirection: Axis.horizontal,
      padding: const EdgeInsets.symmetric(horizontal: 8),
      child: Row(
        children: [
          for (final child in children)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 4),
              child: ChoiceChip(
                key: Key('childSelector-${child.id}'),
                label: Text(child.displayName),
                selected: child.id == selectedId,
                onSelected: (_) => onSelected(child.id),
              ),
            ),
        ],
      ),
    );
  }
}
