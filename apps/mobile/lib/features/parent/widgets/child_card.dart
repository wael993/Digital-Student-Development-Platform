import 'package:digital_student/features/parent/models/parent_models.dart';
import 'package:flutter/material.dart';

class ChildCard extends StatelessWidget {
  const ChildCard({super.key, required this.child, this.onTap});

  final ParentChild child;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        key: Key('childCard-${child.id}'),
        title: Text(child.displayName),
        subtitle: Text(child.classroom.name),
        trailing: onTap == null ? null : const Icon(Icons.chevron_right),
        onTap: onTap,
      ),
    );
  }
}
